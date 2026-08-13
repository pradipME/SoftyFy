package com.softyfy.playlist;

import com.softyfy.common.api.PageResponse;
import com.softyfy.playlist.dto.AddSongsRequest;
import com.softyfy.playlist.dto.CreatePlaylistRequest;
import com.softyfy.playlist.dto.PlaylistDetailDto;
import com.softyfy.playlist.dto.PlaylistPatchRequest;
import com.softyfy.playlist.dto.PlaylistSummaryDto;
import com.softyfy.playlist.dto.ReorderPlaylistSongsRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    public PageResponse<PlaylistSummaryDto> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return playlistService.findAll(page, size);
    }

    @GetMapping("/{id}")
    public PlaylistDetailDto findById(@PathVariable UUID id) {
        return playlistService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistDetailDto create(@Valid @RequestBody CreatePlaylistRequest request) {
        return playlistService.create(request.name(), request.description());
    }

    @PatchMapping("/{id}")
    public PlaylistDetailDto update(@PathVariable UUID id,
                                    @Valid @RequestBody PlaylistPatchRequest request) {
        return playlistService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        playlistService.delete(id);
    }

    @PostMapping("/{id}/songs")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistDetailDto addSongs(@PathVariable UUID id,
                                      @Valid @RequestBody AddSongsRequest request) {
        return playlistService.addSongs(id, request.songIds());
    }

    @DeleteMapping("/{id}/songs/{songId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeSong(@PathVariable UUID id, @PathVariable UUID songId) {
        playlistService.removeSong(id, songId);
    }

    @PutMapping("/{id}/songs/order")
    public PlaylistDetailDto reorder(@PathVariable UUID id,
                                     @Valid @RequestBody ReorderPlaylistSongsRequest request) {
        return playlistService.reorder(id, request.songIds());
    }
}
