package com.softyfy.artist;

import com.softyfy.album.AlbumRepository;
import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.artist.dto.ArtistDetailDto;
import com.softyfy.artist.dto.ArtistListItemDto;
import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.song.SongMapper;
import com.softyfy.song.SongRepository;
import com.softyfy.song.dto.SongSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ArtistService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final SongRepository songRepository;

    public ArtistService(ArtistRepository artistRepository, AlbumRepository albumRepository,
                         SongRepository songRepository) {
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
        this.songRepository = songRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ArtistListItemDto> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.asc("name").ignoreCase()));
        Page<Artist> artists = artistRepository.findAll(pageable);
        Map<UUID, Long> counts = songCounts(artists.getContent());
        return PageResponse.from(artists.map(artist -> new ArtistListItemDto(
                artist.getId(), artist.getName(), counts.getOrDefault(artist.getId(), 0L))));
    }

    @Transactional(readOnly = true)
    public ArtistDetailDto findById(UUID id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ARTIST_NOT_FOUND, "Artist not found: " + id));
        List<AlbumSummaryDto> albums = albumRepository.findByArtistIdOrdered(id).stream()
                .map(AlbumSummaryDto::from)
                .toList();
        List<SongSummaryDto> songs = songRepository.findByArtistId(id).stream()
                .map(SongMapper::toSummary)
                .toList();
        return ArtistDetailDto.from(artist, albums, songs);
    }

    private Map<UUID, Long> songCounts(List<Artist> artists) {
        Map<UUID, Long> counts = new HashMap<>();
        if (artists.isEmpty()) {
            return counts;
        }
        List<UUID> ids = artists.stream().map(Artist::getId).toList();
        for (Object[] row : artistRepository.countSongsByArtistIds(ids)) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }
}
