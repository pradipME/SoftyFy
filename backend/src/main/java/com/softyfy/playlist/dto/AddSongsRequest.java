package com.softyfy.playlist.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record AddSongsRequest(
        @NotEmpty(message = "songIds must not be empty")
        List<UUID> songIds) {
}
