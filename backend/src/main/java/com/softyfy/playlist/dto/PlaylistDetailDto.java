package com.softyfy.playlist.dto;

import com.softyfy.playlist.Playlist;
import com.softyfy.song.dto.SongSummaryDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlaylistDetailDto(
        UUID id,
        String name,
        String description,
        List<SongSummaryDto> songs,
        Instant createdAt,
        Instant updatedAt) {

    public static PlaylistDetailDto from(Playlist playlist, List<SongSummaryDto> songs) {
        return new PlaylistDetailDto(
                playlist.getId(),
                playlist.getName(),
                playlist.getDescription(),
                songs,
                playlist.getCreatedAt(),
                playlist.getUpdatedAt());
    }
}
