package com.softyfy.favorite;

import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.favorite.dto.FavoriteDto;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private SongRepository songRepository;

    private FavoriteService favoriteService;

    private UUID songId;

    @BeforeEach
    void setUp() {
        favoriteService = new FavoriteService(favoriteRepository, songRepository);
        songId = UUID.randomUUID();
    }

    @Test
    void addNewSongSavesFavorite() {
        when(favoriteRepository.existsBySongId(songId)).thenReturn(false);
        Song song = new Song("Song", null, null);
        setId(song, songId);
        when(songRepository.findByIdWithGraph(songId)).thenReturn(List.of(song));
        when(favoriteRepository.save(any(Favorite.class))).thenAnswer(inv -> inv.getArgument(0));

        FavoriteDto dto = favoriteService.add(songId);

        verify(favoriteRepository).save(any(Favorite.class));
        assertThat(dto.songId()).isEqualTo(songId);
    }

    @Test
    void addExistingFavoriteDoesNotSaveAgain() {
        Song song = new Song("Song", null, null);
        setId(song, songId);
        when(favoriteRepository.existsBySongId(songId)).thenReturn(true);
        when(favoriteRepository.findById(songId)).thenReturn(Optional.of(new Favorite(song)));

        favoriteService.add(songId);

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void addUnknownSongThrowsNotFound() {
        when(favoriteRepository.existsBySongId(songId)).thenReturn(false);
        when(songRepository.findByIdWithGraph(songId)).thenReturn(List.of());

        assertThatThrownBy(() -> favoriteService.add(songId))
                .isInstanceOf(NotFoundException.class)
                .satisfies(e -> assertThat(((NotFoundException) e).getErrorCode())
                        .isEqualTo(ErrorCode.SONG_NOT_FOUND));
    }

    @Test
    void removeDeletesBySongId() {
        favoriteService.remove(songId);

        verify(favoriteRepository).deleteBySongId(songId);
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
}
