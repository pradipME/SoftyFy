package com.softyfy.album;

import com.softyfy.album.dto.AlbumDetailDto;
import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.common.api.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

    private final AlbumService albumService;

    public AlbumController(AlbumService albumService) {
        this.albumService = albumService;
    }

    @GetMapping
    public PageResponse<AlbumSummaryDto> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return albumService.findAll(page, size);
    }

    @GetMapping("/{id}")
    public AlbumDetailDto findById(@PathVariable UUID id) {
        return albumService.findById(id);
    }
}
