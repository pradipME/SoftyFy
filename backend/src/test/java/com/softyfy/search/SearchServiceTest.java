package com.softyfy.search;

import com.softyfy.album.AlbumRepository;
import com.softyfy.artist.ArtistRepository;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.playlist.PlaylistRepository;
import com.softyfy.song.SongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private SongRepository songRepository;

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private PlaylistRepository playlistRepository;

    private SearchService searchService;

    @BeforeEach
    void setUp() {
        searchService = new SearchService(songRepository, artistRepository, albumRepository, playlistRepository);
    }

    @Test
    void blankQueryThrowsValidationFailed() {
        assertThatThrownBy(() -> searchService.search("   "))
                .isInstanceOf(ValidationException.class)
                .satisfies(e -> assertThat(((ValidationException) e).getErrorCode())
                        .isEqualTo(ErrorCode.VALIDATION_FAILED));
    }

    @Test
    void nullQueryThrowsValidationFailed() {
        assertThatThrownBy(() -> searchService.search(null))
                .isInstanceOf(ValidationException.class)
                .satisfies(e -> assertThat(((ValidationException) e).getErrorCode())
                        .isEqualTo(ErrorCode.VALIDATION_FAILED));
    }

    @Test
    void searchQueriesAllRepositories() {
        when(songRepository.search(eq("queen"), any())).thenReturn(Page.empty());
        when(artistRepository.searchByName(eq("queen"), any())).thenReturn(Page.empty());
        when(albumRepository.searchByTitle(eq("queen"), any())).thenReturn(Page.empty());
        when(playlistRepository.searchByName(eq("queen"), any())).thenReturn(Page.empty());

        searchService.search(" queen ");

        verify(songRepository).search(eq("queen"), any());
        verify(artistRepository).searchByName(eq("queen"), any());
        verify(albumRepository).searchByTitle(eq("queen"), any());
        verify(playlistRepository).searchByName(eq("queen"), any());
    }
}
