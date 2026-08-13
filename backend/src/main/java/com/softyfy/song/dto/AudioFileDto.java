package com.softyfy.song.dto;

import com.softyfy.song.AudioFile;

import java.util.UUID;

public record AudioFileDto(
        UUID id,
        String storageProvider,
        String storageKey,
        String format,
        Integer bitrateKbps,
        Long sizeBytes,
        boolean primary) {

    public static AudioFileDto from(AudioFile audioFile) {
        return new AudioFileDto(
                audioFile.getId(),
                audioFile.getStorageProvider(),
                audioFile.getStorageKey(),
                audioFile.getFormat(),
                audioFile.getBitrateKbps(),
                audioFile.getSizeBytes(),
                audioFile.isPrimary());
    }
}
