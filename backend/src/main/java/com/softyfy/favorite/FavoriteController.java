package com.softyfy.favorite;

import com.softyfy.common.api.PageResponse;
import com.softyfy.favorite.dto.FavoriteDto;
import com.softyfy.favorite.dto.FavoriteRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public PageResponse<FavoriteDto> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return favoriteService.findAll(page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FavoriteDto add(@Valid @RequestBody FavoriteRequest request) {
        return favoriteService.add(request.songId());
    }

    @PostMapping("/{songId}")
    @ResponseStatus(HttpStatus.CREATED)
    public FavoriteDto addByPath(@PathVariable UUID songId) {
        return favoriteService.add(songId);
    }

    @DeleteMapping("/{songId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID songId) {
        favoriteService.remove(songId);
    }
}
