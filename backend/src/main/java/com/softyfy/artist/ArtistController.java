package com.softyfy.artist;

import com.softyfy.artist.dto.ArtistDetailDto;
import com.softyfy.artist.dto.ArtistListItemDto;
import com.softyfy.common.api.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    @GetMapping
    public PageResponse<ArtistListItemDto> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return artistService.findAll(page, size);
    }

    @GetMapping("/{id}")
    public ArtistDetailDto findById(@PathVariable UUID id) {
        return artistService.findById(id);
    }
}
