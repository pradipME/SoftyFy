package com.softyfy.song;

import com.softyfy.album.AlbumRepository;
import com.softyfy.artist.Artist;
import com.softyfy.artist.ArtistRepository;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.song.dto.CreateSongRequest;
import com.softyfy.song.dto.SongDto;
import com.softyfy.storage.AudioStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SongServiceTest {

    @Mock
    private SongRepository songRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private AudioFileRepository audioFileRepository;

    @Mock
    private AudioStorage audioStorage;

    private SongService songService;

    @BeforeEach
    void setUp() {
        songService = new SongService(songRepository, albumRepository, artistRepository,
                audioFileRepository, audioStorage);
    }

    @Test
    void createResolvesExistingArtistAndCreatesNewOnes() {
        Artist existing = new Artist("Existing");
        when(artistRepository.findByNameIgnoreCase("Existing")).thenReturn(List.of(existing));
        when(artistRepository.findByNameIgnoreCase("New")).thenReturn(List.of());
        when(artistRepository.save(any(Artist.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateSongRequest request = new CreateSongRequest("Song", null, null, null,
                List.of("Existing", "New"));

        SongDto dto = songService.create(request);

        verify(artistRepository).save(any(Artist.class));
        verify(songRepository).save(any(Song.class));
        assertThat(dto.title()).isEqualTo("Song");
        assertThat(dto.artists()).extracting(a -> a.name())
                .containsExactlyInAnyOrder("Existing", "New");
    }

    @Test
    void createWithUnknownAlbumThrowsNotFound() {
        UUID albumId = UUID.randomUUID();
        when(albumRepository.findById(albumId)).thenReturn(Optional.empty());
        CreateSongRequest request = new CreateSongRequest("Song", null, null, albumId, null);

        assertThatThrownBy(() -> songService.create(request))
                .isInstanceOf(NotFoundException.class)
                .satisfies(e -> assertThat(((NotFoundException) e).getErrorCode())
                        .isEqualTo(ErrorCode.ALBUM_NOT_FOUND));

        verify(songRepository, never()).save(any());
    }

    @Test
    void findByIdThrowsNotFoundWhenMissing() {
        UUID id = UUID.randomUUID();
        when(songRepository.findByIdWithGraph(id)).thenReturn(List.of());

        assertThatThrownBy(() -> songService.findById(id))
                .isInstanceOf(NotFoundException.class)
                .satisfies(e -> assertThat(((NotFoundException) e).getErrorCode())
                        .isEqualTo(ErrorCode.SONG_NOT_FOUND));
    }

    @Test
    void findAllWithInvalidSortThrowsInvalidSort() {
        assertThatThrownBy(() -> songService.findAll(0, 20, "bogus"))
                .isInstanceOf(ValidationException.class)
                .satisfies(e -> assertThat(((ValidationException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_SORT));

        verify(songRepository, never()).findAllOrderByTitle(any());
    }

    @Test
    void findAllWithTitleSortUsesTitleQuery() {
        when(songRepository.findAllOrderByTitle(any(Pageable.class))).thenReturn(Page.empty());

        songService.findAll(0, 20, "title");

        verify(songRepository).findAllOrderByTitle(any(Pageable.class));
    }

    @Test
    void deleteRemovesStoredAudioObjectsBeforeDeletingSong() throws IOException {
        UUID id = UUID.randomUUID();
        Song song = new Song("Song", null, List.of());
        AudioFile audioFile = new AudioFile(song, "local", "audio/1.mp3", "mp3", 320, 1000L, true);
        song.addAudioFile(audioFile);
        when(songRepository.findByIdWithGraph(id)).thenReturn(List.of(song));

        songService.delete(id);

        verify(audioStorage).delete("audio/1.mp3");
        verify(songRepository).delete(song);
    }

    @Test
    void deleteKeepsDeletingDatabaseRowWhenStorageCleanupFails() throws IOException {
        UUID id = UUID.randomUUID();
        Song song = new Song("Song", null, List.of());
        AudioFile audioFile = new AudioFile(song, "local", "audio/1.mp3", "mp3", 320, 1000L, true);
        song.addAudioFile(audioFile);
        when(songRepository.findByIdWithGraph(id)).thenReturn(List.of(song));
        org.mockito.Mockito.doThrow(new IOException("disk error"))
                .when(audioStorage).delete("audio/1.mp3");

        songService.delete(id);

        verify(songRepository).delete(song);
    }
}
