package com.softyfy.song.dto;

import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.song.Song;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SongDto(
        UUID id,
        String title,
        Integer durationSeconds,
        Integer trackNumber,
        AlbumSummaryDto album,
        List<ArtistSummaryDto> artists,
        List<AudioFileDto> audioFiles,
        Instant createdAt,
        Instant updatedAt) {

    public static SongDto from(Song song) {
        return new SongDto(
                song.getId(),
                song.getTitle(),
                song.getDurationSeconds(),
                song.getTrackNumber(),
                song.getAlbum() != null ? AlbumSummaryDto.from(song.getAlbum()) : null,
                song.getArtists().stream().map(ArtistSummaryDto::from).toList(),
                song.getAudioFiles().stream().map(AudioFileDto::from).toList(),
                song.getCreatedAt(),
                song.getUpdatedAt());
    }
}
