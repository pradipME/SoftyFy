package com.softyfy.song;

import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.song.dto.SongDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SongController.class)
class SongControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SongService songService;

    @Test
    void findByIdReturns404ProblemDetail() throws Exception {
        UUID id = UUID.randomUUID();
        when(songService.findById(id))
                .thenThrow(new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + id));

        mockMvc.perform(get("/api/songs/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SONG_NOT_FOUND"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Song not found: " + id));
    }

    @Test
    void findAllReturnsPage() throws Exception {
        when(songService.findAll(anyInt(), anyInt(), isNull()))
                .thenReturn(PageResponse.from(org.springframework.data.domain.Page.empty()));

        mockMvc.perform(get("/api/songs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void findAllWithInvalidSortReturns400() throws Exception {
        when(songService.findAll(eq(0), eq(20), eq("bogus")))
                .thenThrow(new ValidationException(ErrorCode.INVALID_SORT, "Invalid sort option"));

        mockMvc.perform(get("/api/songs").param("sort", "bogus"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_SORT"));
    }

    @Test
    void createReturns201() throws Exception {
        SongDto dto = new SongDto(UUID.randomUUID(), "Song", null, null, null, List.of(), List.of(), null, null);
        when(songService.create(org.mockito.ArgumentMatchers.any()))
                .thenReturn(dto);

        mockMvc.perform(post("/api/songs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Song", "artistNames": ["Artist"]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Song"));
    }

    @Test
    void createWithBlankTitleReturns400ValidationError() throws Exception {
        mockMvc.perform(post("/api/songs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void updateReturns200WithPatchedFields() throws Exception {
        UUID id = UUID.randomUUID();
        SongDto dto = new SongDto(id, "Renamed", 200, null, null, List.of(), List.of(), null, null);
        when(songService.update(eq(id), org.mockito.ArgumentMatchers.any()))
                .thenReturn(dto);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/songs/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Renamed", "durationSeconds": 200}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Renamed"))
                .andExpect(jsonPath("$.durationSeconds").value(200));
    }

    @Test
    void updateWithBlankTitleReturns400() throws Exception {
        UUID id = UUID.randomUUID();
        when(songService.update(eq(id), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new ValidationException(ErrorCode.VALIDATION_FAILED, "title must not be blank"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/songs/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void deleteReturns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/songs/{id}", id))
                .andExpect(status().isNoContent());

        verify(songService).delete(id);
    }

    @Test
    void deleteUnknownSongReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + id))
                .when(songService).delete(id);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/songs/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SONG_NOT_FOUND"));
    }
}
