package com.softyfy.song;

import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.song.dto.AudioFileDto;
import com.softyfy.song.dto.SongDto;
import com.softyfy.song.dto.SongSummaryDto;

import java.util.Comparator;
import java.util.List;

public final class SongMapper {

    private SongMapper() {
    }

    public static SongDto toDto(Song song) {
        return new SongDto(
                song.getId(),
                song.getTitle(),
                song.getDurationSeconds(),
                song.getTrackNumber(),
                song.getAlbum() != null ? AlbumSummaryDto.from(song.getAlbum()) : null,
                song.getArtists().stream()
                        .map(ArtistSummaryDto::from)
                        .sorted(Comparator.comparing(ArtistSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                        .toList(),
                song.getAudioFiles().stream()
                        .sorted(Comparator.comparing(AudioFile::isPrimary).reversed()
                                .thenComparing(AudioFile::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(AudioFileDto::from)
                        .toList(),
                song.getCreatedAt(),
                song.getUpdatedAt());
    }

    public static SongSummaryDto toSummary(Song song) {
        return SongSummaryDto.from(song);
    }
}
