package com.softyfy.song;

import com.softyfy.common.api.PageResponse;
import com.softyfy.song.dto.CreateSongRequest;
import com.softyfy.song.dto.SongDto;
import com.softyfy.song.dto.SongPatchRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private final SongService songService;

    public SongController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping
    public PageResponse<SongDto> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        return songService.findAll(page, size, sort);
    }

    @GetMapping("/{id}")
    public SongDto findById(@PathVariable UUID id) {
        return songService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SongDto create(@Valid @RequestBody CreateSongRequest request) {
        return songService.create(request);
    }

    @PatchMapping("/{id}")
    public SongDto update(@PathVariable UUID id, @Valid @RequestBody SongPatchRequest request) {
        return songService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        songService.delete(id);
    }
}
