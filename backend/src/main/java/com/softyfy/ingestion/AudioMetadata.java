package com.softyfy.ingestion;

import java.util.List;

/**
 * Metadata extracted from an uploaded audio file. Optional fields are null when
 * the source file does not carry them. Genre and disc number are read but not
 * persisted in this phase.
 */
public record AudioMetadata(
        String title,
        List<String> artistNames,
        String albumName,
        String albumArtistName,
        Integer year,
        Integer durationSeconds,
        Integer trackNumber,
        Integer discNumber,
        Integer bitrateKbps,
        Integer sampleRateHz,
        Integer channels,
        Integer bitDepth,
        String format,
        String label) {
}
