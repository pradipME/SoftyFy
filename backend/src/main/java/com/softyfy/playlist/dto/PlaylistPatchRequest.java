package com.softyfy.playlist.dto;

import jakarta.validation.constraints.Size;

public record PlaylistPatchRequest(
        @Size(max = 200, message = "name must be at most 200 characters")
        String name,

        @Size(max = 500, message = "description must be at most 500 characters")
        String description) {
}
