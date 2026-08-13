package com.softyfy.favorite.dto;

import com.softyfy.favorite.Favorite;
import com.softyfy.song.dto.SongSummaryDto;

import java.time.Instant;
import java.util.UUID;

public record FavoriteDto(
        UUID songId,
        SongSummaryDto song,
        Instant createdAt) {

    public static FavoriteDto from(Favorite favorite) {
        return new FavoriteDto(
                favorite.getSong().getId(),
                SongSummaryDto.from(favorite.getSong()),
                favorite.getCreatedAt());
    }
}
