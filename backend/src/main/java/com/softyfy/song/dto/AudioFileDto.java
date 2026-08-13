package com.softyfy.song.dto;

import com.softyfy.song.AudioFile;

import java.util.UUID;

public record AudioFileDto(
        UUID id,
        String storageProvider,
        String storageKey,
        String format,
        String label,
        Integer bitrateKbps,
        Integer sampleRateHz,
        Integer channels,
        Integer bitDepth,
        Long sizeBytes,
        String contentType,
        boolean primary) {

    public static AudioFileDto from(AudioFile audioFile) {
        return new AudioFileDto(
                audioFile.getId(),
                audioFile.getStorageProvider(),
                audioFile.getStorageKey(),
                audioFile.getFormat(),
                audioFile.getLabel(),
                audioFile.getBitrateKbps(),
                audioFile.getSampleRateHz(),
                audioFile.getChannels(),
                audioFile.getBitDepth(),
                audioFile.getSizeBytes(),
                audioFile.getContentType(),
                audioFile.isPrimary());
    }
}
