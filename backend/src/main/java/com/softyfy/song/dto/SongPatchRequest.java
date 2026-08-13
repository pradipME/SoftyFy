package com.softyfy.song.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record SongPatchRequest(
        @Size(max = 300, message = "title must be at most 300 characters")
        String title,

        @Min(value = 0, message = "durationSeconds must be positive")
        Integer durationSeconds,

        @Min(value = 1, message = "trackNumber must be positive")
        Integer trackNumber) {
}
