package com.softyfy.song.dto;

import com.softyfy.song.Song;

import java.util.List;
import java.util.UUID;

public record SongSummaryDto(
        UUID id,
        String title,
        Integer durationSeconds,
        List<String> artistNames,
        UUID albumId,
        String albumTitle) {

    public static SongSummaryDto from(Song song) {
        return new SongSummaryDto(
                song.getId(),
                song.getTitle(),
                song.getDurationSeconds(),
                song.getArtists().stream().map(a -> a.getName()).sorted(String.CASE_INSENSITIVE_ORDER).toList(),
                song.getAlbum() != null ? song.getAlbum().getId() : null,
                song.getAlbum() != null ? song.getAlbum().getTitle() : null);
    }
}
