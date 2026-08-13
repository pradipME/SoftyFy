package com.softyfy.song.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateSongRequest(
        @NotBlank(message = "title is required")
        @Size(max = 300, message = "title must be at most 300 characters")
        String title,

        @Min(value = 0, message = "durationSeconds must be positive")
        Integer durationSeconds,

        @Min(value = 1, message = "trackNumber must be positive")
        Integer trackNumber,

        UUID albumId,

        @Size(max = 20, message = "artistNames must contain at most 20 names")
        List<@NotBlank(message = "artist name must not be blank")
                @Size(max = 200, message = "artist name must be at most 200 characters") String> artistNames) {
}
