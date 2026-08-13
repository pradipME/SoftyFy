package com.softyfy.artist.dto;

import com.softyfy.artist.Artist;
import com.softyfy.album.dto.AlbumSummaryDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ArtistDetailDto(
        UUID id,
        String name,
        List<AlbumSummaryDto> albums,
        Instant createdAt,
        Instant updatedAt) {

    public static ArtistDetailDto from(Artist artist, List<AlbumSummaryDto> albums) {
        return new ArtistDetailDto(
                artist.getId(),
                artist.getName(),
                albums,
                artist.getCreatedAt(),
                artist.getUpdatedAt());
    }
}
