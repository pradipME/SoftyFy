package com.softyfy.album.dto;

import com.softyfy.album.Album;

import java.util.UUID;

public record AlbumSummaryDto(
        UUID id,
        String title,
        Integer year,
        UUID artistId,
        String artistName) {

    public static AlbumSummaryDto from(Album album) {
        return new AlbumSummaryDto(
                album.getId(),
                album.getTitle(),
                album.getYear(),
                album.getArtist() != null ? album.getArtist().getId() : null,
                album.getArtist() != null ? album.getArtist().getName() : null);
    }
}
