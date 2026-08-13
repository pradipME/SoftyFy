package com.softyfy.artist;

import com.softyfy.album.AlbumRepository;
import com.softyfy.artist.dto.ArtistDetailDto;
import com.softyfy.artist.dto.ArtistListItemDto;
import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArtistServiceTest {

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private SongRepository songRepository;

    private ArtistService artistService;

    @BeforeEach
    void setUp() {
        artistService = new ArtistService(artistRepository, albumRepository, songRepository);
    }

    @Test
    void findAllIncludesSongCounts() {
        UUID id = UUID.randomUUID();
        Artist artist = new Artist("Queen");
        setId(artist, id);
        Page<Artist> page = new PageImpl<>(List.of(artist));
        when(artistRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(artistRepository.countSongsByArtistIds(any())).thenReturn(List.<Object[]>of(new Object[]{id, 3L}));

        PageResponse<ArtistListItemDto> result = artistService.findAll(0, 20);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).id()).isEqualTo(id);
        assertThat(result.content().get(0).songCount()).isEqualTo(3L);
    }

    @Test
    void findByIdReturnsDetailWithAlbumsAndSongs() {
        UUID id = UUID.randomUUID();
        Artist artist = new Artist("Queen");
        setId(artist, id);
        Song song = new Song("Bohemian Rhapsody", null, List.of(artist));
        when(artistRepository.findById(id)).thenReturn(Optional.of(artist));
        when(albumRepository.findByArtistIdOrdered(id)).thenReturn(List.of());
        when(songRepository.findByArtistId(id)).thenReturn(List.of(song));

        ArtistDetailDto detail = artistService.findById(id);

        assertThat(detail.id()).isEqualTo(id);
        assertThat(detail.albums()).isEmpty();
        assertThat(detail.songs()).extracting(s -> s.title()).containsExactly("Bohemian Rhapsody");
    }

    @Test
    void findByIdUnknownThrowsNotFound() {
        UUID id = UUID.randomUUID();
        when(artistRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> artistService.findById(id))
                .isInstanceOf(NotFoundException.class)
                .satisfies(e -> assertThat(((NotFoundException) e).getErrorCode())
                        .isEqualTo(ErrorCode.ARTIST_NOT_FOUND));
    }

    @Test
    void findAllSortsByNameAscending() {
        when(artistRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        artistService.findAll(0, 20);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        org.mockito.Mockito.verify(artistRepository).findAll(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(PageRequest.class);
        assertThat(captor.getValue().getSort().getOrderFor("name")).isNotNull();
        assertThat(captor.getValue().getSort().getOrderFor("name").getDirection())
                .isEqualTo(Sort.Direction.ASC);
    }

    private void setId(Artist artist, UUID id) {
        try {
            var field = Artist.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(artist, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
