package com.softyfy.favorite;

import com.softyfy.common.api.PageResponse;
import com.softyfy.favorite.dto.FavoriteDto;
import com.softyfy.song.dto.SongSummaryDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FavoriteController.class)
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FavoriteService favoriteService;

    @Test
    void addByPathReturns201() throws Exception {
        UUID songId = UUID.randomUUID();
        FavoriteDto dto = new FavoriteDto(songId,
                new SongSummaryDto(songId, "Song", null, List.of(), null, null),
                Instant.now());
        when(favoriteService.add(songId)).thenReturn(dto);

        mockMvc.perform(post("/api/favorites/{songId}", songId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.songId").value(songId.toString()));
    }

    @Test
    void addWithBodyReturns201() throws Exception {
        UUID songId = UUID.randomUUID();
        FavoriteDto dto = new FavoriteDto(songId,
                new SongSummaryDto(songId, "Song", null, List.of(), null, null),
                Instant.now());
        when(favoriteService.add(any())).thenReturn(dto);

        mockMvc.perform(post("/api/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"songId\": \"" + songId + "\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void addWithMissingSongIdReturns400() throws Exception {
        mockMvc.perform(post("/api/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.songId").exists());
    }

    @Test
    void removeReturns204() throws Exception {
        UUID songId = UUID.randomUUID();

        mockMvc.perform(delete("/api/favorites/{songId}", songId))
                .andExpect(status().isNoContent());

        verify(favoriteService).remove(songId);
    }

    @Test
    void findAllReturnsPage() throws Exception {
        when(favoriteService.findAll(anyInt(), anyInt()))
                .thenReturn(PageResponse.from(org.springframework.data.domain.Page.empty()));

        mockMvc.perform(get("/api/favorites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
