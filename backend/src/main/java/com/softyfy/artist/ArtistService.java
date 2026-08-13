package com.softyfy.artist;

import com.softyfy.album.AlbumRepository;
import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.artist.dto.ArtistDetailDto;
import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ArtistService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;

    public ArtistService(ArtistRepository artistRepository, AlbumRepository albumRepository) {
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ArtistSummaryDto> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.asc("name").ignoreCase()));
        Page<Artist> artists = artistRepository.findAll(pageable);
        return PageResponse.from(artists.map(ArtistSummaryDto::from));
    }

    @Transactional(readOnly = true)
    public ArtistDetailDto findById(UUID id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ARTIST_NOT_FOUND, "Artist not found: " + id));
        var albums = albumRepository.findByArtistIdOrdered(id).stream()
                .map(AlbumSummaryDto::from)
                .toList();
        return ArtistDetailDto.from(artist, albums);
    }
}
