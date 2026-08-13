package com.softyfy.playlist;

import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.playlist.dto.PlaylistDetailDto;
import com.softyfy.playlist.dto.PlaylistSummaryDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PlaylistController.class)
class PlaylistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PlaylistService playlistService;

    @Test
    void findAllReturnsPage() throws Exception {
        when(playlistService.findAll(anyInt(), anyInt()))
                .thenReturn(PageResponse.from(org.springframework.data.domain.Page.empty()));

        mockMvc.perform(get("/api/playlists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void findByIdReturnsDetail() throws Exception {
        UUID id = UUID.randomUUID();
        PlaylistDetailDto dto = new PlaylistDetailDto(id, "Chill", null, List.of(), null, null);
        when(playlistService.findById(id)).thenReturn(dto);

        mockMvc.perform(get("/api/playlists/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Chill"));
    }

    @Test
    void findByIdUnknownReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(playlistService.findById(id))
                .thenThrow(new NotFoundException(ErrorCode.PLAYLIST_NOT_FOUND, "Playlist not found: " + id));

        mockMvc.perform(get("/api/playlists/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PLAYLIST_NOT_FOUND"));
    }

    @Test
    void createReturns201() throws Exception {
        PlaylistDetailDto dto = new PlaylistDetailDto(UUID.randomUUID(), "Chill", "Lo-fi", List.of(), null, null);
        when(playlistService.create("Chill", "Lo-fi")).thenReturn(dto);

        mockMvc.perform(post("/api/playlists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Chill", "description": "Lo-fi"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Chill"));
    }

    @Test
    void createWithBlankNameReturns400() throws Exception {
        mockMvc.perform(post("/api/playlists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void updateReturns200() throws Exception {
        UUID id = UUID.randomUUID();
        PlaylistDetailDto dto = new PlaylistDetailDto(id, "Renamed", "desc", List.of(), null, null);
        when(playlistService.update(eq(id), any())).thenReturn(dto);

        mockMvc.perform(patch("/api/playlists/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Renamed"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed"));
    }

    @Test
    void deleteReturns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/playlists/{id}", id))
                .andExpect(status().isNoContent());

        verify(playlistService).delete(id);
    }

    @Test
    void deleteUnknownReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new NotFoundException(ErrorCode.PLAYLIST_NOT_FOUND, "Playlist not found: " + id))
                .when(playlistService).delete(id);

        mockMvc.perform(delete("/api/playlists/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PLAYLIST_NOT_FOUND"));
    }

    @Test
    void reorderReturnsUpdatedOrder() throws Exception {
        UUID id = UUID.randomUUID();
        PlaylistDetailDto dto = new PlaylistDetailDto(id, "Chill", null, List.of(), null, null);
        when(playlistService.reorder(eq(id), any())).thenReturn(dto);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/playlists/{id}/songs/order", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"songIds": ["01950f1e-2f9a-70b2-8000-000000000001", "01950f1e-2f9a-70b2-8000-000000000002"]}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void addSongsReturns201() throws Exception {
        UUID id = UUID.randomUUID();
        PlaylistDetailDto dto = new PlaylistDetailDto(id, "Chill", null, List.of(), null, null);
        when(playlistService.addSongs(eq(id), any())).thenReturn(dto);

        mockMvc.perform(post("/api/playlists/{id}/songs", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"songIds": ["01950f1e-2f9a-70b2-8000-000000000001"]}
                                """))
                .andExpect(status().isCreated());
    }
}
