package com.softyfy.album;

import com.softyfy.album.dto.AlbumDetailDto;
import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.song.Song;
import com.softyfy.song.SongMapper;
import com.softyfy.song.SongRepository;
import com.softyfy.song.dto.SongSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AlbumService {

    private static final int MAX_PAGE_SIZE = 100;

    private final AlbumRepository albumRepository;
    private final SongRepository songRepository;

    public AlbumService(AlbumRepository albumRepository, SongRepository songRepository) {
        this.albumRepository = albumRepository;
        this.songRepository = songRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AlbumSummaryDto> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("year").nullsLast(), Sort.Order.asc("title").ignoreCase()));
        Page<Album> albums = albumRepository.findAll(pageable);
        return PageResponse.from(albums.map(AlbumSummaryDto::from));
    }

    @Transactional(readOnly = true)
    public AlbumDetailDto findById(UUID id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ALBUM_NOT_FOUND, "Album not found: " + id));
        List<SongSummaryDto> songs = songRepository.findByAlbumId(id).stream()
                .map(SongMapper::toSummary)
                .toList();
        return AlbumDetailDto.from(album, songs);
    }
}
