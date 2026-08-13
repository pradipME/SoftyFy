package com.softyfy.playlist.dto;

import com.softyfy.playlist.Playlist;

import java.util.UUID;

public record PlaylistSummaryDto(
        UUID id,
        String name,
        String description,
        int songCount) {

    public static PlaylistSummaryDto from(Playlist playlist) {
        return new PlaylistSummaryDto(
                playlist.getId(),
                playlist.getName(),
                playlist.getDescription(),
                playlist.getSongs().size());
    }
}
