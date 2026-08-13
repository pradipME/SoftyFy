package com.softyfy.favorite;

import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.favorite.dto.FavoriteDto;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class FavoriteService {

    private static final int MAX_PAGE_SIZE = 100;

    private final FavoriteRepository favoriteRepository;
    private final SongRepository songRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, SongRepository songRepository) {
        this.favoriteRepository = favoriteRepository;
        this.songRepository = songRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<FavoriteDto> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Favorite> favorites = favoriteRepository.findAllWithSong(pageable);
        return PageResponse.from(favorites.map(FavoriteDto::from));
    }

    @Transactional
    public FavoriteDto add(UUID songId) {
        if (favoriteRepository.existsBySongId(songId)) {
            return favoriteRepository.findById(songId).map(FavoriteDto::from).orElseThrow();
        }
        Song song = songRepository.findByIdWithGraph(songId).stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + songId));
        Favorite favorite = favoriteRepository.save(new Favorite(song));
        return FavoriteDto.from(favorite);
    }

    @Transactional
    public void remove(UUID songId) {
        favoriteRepository.deleteBySongId(songId);
    }
}
