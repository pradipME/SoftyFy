package com.softyfy.favorite.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FavoriteRequest(@NotNull(message = "songId is required") UUID songId) {
}
