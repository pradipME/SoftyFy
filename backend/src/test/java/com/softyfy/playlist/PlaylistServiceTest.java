package com.softyfy.playlist;

import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.playlist.dto.PlaylistDetailDto;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

    @Mock
    private PlaylistRepository playlistRepository;

    @Mock
    private SongRepository songRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private PlaylistService playlistService;

    private UUID playlistId;
    private UUID song1;
    private UUID song2;
    private UUID song3;

    @BeforeEach
    void setUp() {
        playlistService = new PlaylistService(playlistRepository, songRepository, jdbcTemplate);
        playlistId = UUID.randomUUID();
        song1 = UUID.randomUUID();
        song2 = UUID.randomUUID();
        song3 = UUID.randomUUID();
    }

    private Playlist playlistWithSongs(UUID... songIds) {
        Playlist playlist = new Playlist("Test", null);
        int position = 0;
        for (UUID songId : songIds) {
            playlist.getSongs().add(new PlaylistSong(playlist, song(songId), position++));
        }
        return playlist;
    }

    private Song song(UUID id) {
        Song song = new Song("Song", null, null);
        setId(song, id);
        return song;
    }

    private void setId(Song song, UUID id) {
        try {
            var field = Song.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(song, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    void reorderUpdatesPositionsWithSingleAtomicSql() {
        when(playlistRepository.findByIdWithSongs(playlistId))
                .thenReturn(List.of(playlistWithSongs(song1, song2, song3)));
        List<UUID> requested = List.of(song3, song1, song2);

        PlaylistDetailDto result = playlistService.reorder(playlistId, requested);

        ArgumentCaptor<Object[]> captor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate).update(anyString(), captor.capture());
        assertThat(captor.getValue()).containsExactly(song3, song1, song2, playlistId);

        assertThat(result.songs()).extracting(s -> s.id())
                .containsExactly(song3, song1, song2);
    }

    @Test
    void reorderWithMissingSongThrowsInvalidReorder() {
        when(playlistRepository.findByIdWithSongs(playlistId))
                .thenReturn(List.of(playlistWithSongs(song1, song2, song3)));

        assertThatThrownBy(() -> playlistService.reorder(playlistId, List.of(song1, song2)))
                .isInstanceOf(ValidationException.class)
                .satisfies(e -> assertThat(((ValidationException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_REORDER_REQUEST));

        verify(jdbcTemplate, never()).update(anyString(), (Object[]) any());
    }

    @Test
    void reorderWithExtraSongThrowsInvalidReorder() {
        when(playlistRepository.findByIdWithSongs(playlistId))
                .thenReturn(List.of(playlistWithSongs(song1, song2, song3)));

        assertThatThrownBy(() -> playlistService.reorder(playlistId, List.of(song1, song2, song3, song3)))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void reorderWithUnknownSongThrowsInvalidReorder() {
        when(playlistRepository.findByIdWithSongs(playlistId))
                .thenReturn(List.of(playlistWithSongs(song1, song2, song3)));
        UUID unknown = UUID.randomUUID();

        assertThatThrownBy(() -> playlistService.reorder(playlistId, List.of(song1, song2, unknown)))
                .isInstanceOf(ValidationException.class)
                .satisfies(e -> assertThat(((ValidationException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_REORDER_REQUEST));
    }

    @Test
    void reorderEmptyPlaylistIsNoOp() {
        when(playlistRepository.findByIdWithSongs(playlistId))
                .thenReturn(List.of(playlistWithSongs()));

        PlaylistDetailDto result = playlistService.reorder(playlistId, List.of());

        verify(jdbcTemplate, never()).update(anyString(), (Object[]) any());
        assertThat(result.songs()).isEmpty();
    }

    @Test
    void reorderEmptyPlaylistWithSongsThrowsInvalidReorder() {
        when(playlistRepository.findByIdWithSongs(playlistId))
                .thenReturn(List.of(playlistWithSongs()));

        assertThatThrownBy(() -> playlistService.reorder(playlistId, List.of(song1)))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void reorderUnknownPlaylistThrowsNotFound() {
        when(playlistRepository.findByIdWithSongs(playlistId)).thenReturn(List.of());

        assertThatThrownBy(() -> playlistService.reorder(playlistId, List.of(song1)))
                .isInstanceOf(NotFoundException.class)
                .satisfies(e -> assertThat(((NotFoundException) e).getErrorCode())
                        .isEqualTo(ErrorCode.PLAYLIST_NOT_FOUND));
    }
}
