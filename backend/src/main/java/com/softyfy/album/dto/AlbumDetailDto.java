package com.softyfy.album.dto;

import com.softyfy.album.Album;
import com.softyfy.song.dto.SongSummaryDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AlbumDetailDto(
        UUID id,
        String title,
        Integer year,
        UUID artistId,
        String artistName,
        List<SongSummaryDto> songs,
        Instant createdAt,
        Instant updatedAt) {

    public static AlbumDetailDto from(Album album, List<SongSummaryDto> songs) {
        return new AlbumDetailDto(
                album.getId(),
                album.getTitle(),
                album.getYear(),
                album.getArtist() != null ? album.getArtist().getId() : null,
                album.getArtist() != null ? album.getArtist().getName() : null,
                songs,
                album.getCreatedAt(),
                album.getUpdatedAt());
    }
}
