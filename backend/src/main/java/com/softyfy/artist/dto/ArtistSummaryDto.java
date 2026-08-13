package com.softyfy.artist.dto;

import com.softyfy.artist.Artist;

import java.util.UUID;

public record ArtistSummaryDto(UUID id, String name) {

    public static ArtistSummaryDto from(Artist artist) {
        return new ArtistSummaryDto(artist.getId(), artist.getName());
    }
}
