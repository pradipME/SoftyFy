package com.softyfy.artist.dto;

import java.util.UUID;

public record ArtistListItemDto(UUID id, String name, long songCount) {
}
