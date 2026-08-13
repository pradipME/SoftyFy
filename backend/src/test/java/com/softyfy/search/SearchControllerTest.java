package com.softyfy.search;

import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.playlist.dto.PlaylistSummaryDto;
import com.softyfy.song.dto.SongSummaryDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SearchController.class)
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SearchService searchService;

    @Test
    void searchReturnsGroupedResults() throws Exception {
        UUID songId = UUID.randomUUID();
        SearchResultsDto results = new SearchResultsDto(
                List.of(new SongSummaryDto(songId, "Song", 120, List.of("Artist"), null, null)),
                List.of(new ArtistSummaryDto(UUID.randomUUID(), "Artist")),
                List.of(new AlbumSummaryDto(UUID.randomUUID(), "Album", 2020, null, null)),
                List.of(new PlaylistSummaryDto(UUID.randomUUID(), "Playlist", null, 0)));
        when(searchService.search("art")).thenReturn(results);

        mockMvc.perform(get("/api/search").param("q", "art"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.songs[0].title").value("Song"))
                .andExpect(jsonPath("$.artists[0].name").value("Artist"))
                .andExpect(jsonPath("$.albums[0].title").value("Album"))
                .andExpect(jsonPath("$.playlists[0].name").value("Playlist"));
    }

    @Test
    void blankQueryReturns400() throws Exception {
        when(searchService.search("   ")).thenThrow(new ValidationException(ErrorCode.VALIDATION_FAILED, "q must not be blank"));

        mockMvc.perform(get("/api/search").param("q", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void missingQueryReturns400() throws Exception {
        mockMvc.perform(get("/api/search"))
                .andExpect(status().isBadRequest());
    }
}
