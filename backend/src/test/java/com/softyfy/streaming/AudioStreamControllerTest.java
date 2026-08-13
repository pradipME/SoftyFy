package com.softyfy.streaming;

import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.StorageException;
import com.softyfy.song.AudioFile;
import com.softyfy.storage.AudioObjectInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AudioStreamController.class)
class AudioStreamControllerTest {

    private static final int TOTAL = 2000;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AudioStreamService streamService;

    private static byte[] fileBytes(int size) {
        byte[] bytes = new byte[size];
        for (int i = 0; i < size; i++) {
            bytes[i] = (byte) i;
        }
        return bytes;
    }

    private static byte[] slice(int from, int length) {
        byte[] bytes = new byte[length];
        System.arraycopy(fileBytes(TOTAL), from, bytes, 0, length);
        return bytes;
    }

    private StreamTarget target() {
        AudioFile file = new AudioFile();
        file.setStorageKey("audio/1.mp3");
        file.setFormat("mp3");
        file.setContentType("audio/mpeg");
        return new StreamTarget(file, new AudioObjectInfo("audio/1.mp3", TOTAL, null), "audio/mpeg");
    }

    private void stubResolve(UUID id) {
        when(streamService.resolve(id)).thenReturn(target());
    }

    @Test
    void noRangeReturns200FullObject() throws Exception {
        UUID id = UUID.randomUUID();
        StreamTarget target = target();
        when(streamService.resolve(id)).thenReturn(target);
        when(streamService.open(target.audioFile(), 0, -1))
                .thenReturn(new ByteArrayInputStream(fileBytes(TOTAL)));

        mockMvc.perform(get("/api/songs/{id}/stream", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType("audio/mpeg"))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable"))
                .andExpect(header().longValue(HttpHeaders.CONTENT_LENGTH, TOTAL))
                .andExpect(content().bytes(fileBytes(TOTAL)));

        verify(streamService).open(target.audioFile(), 0, -1);
    }

    @Test
    void rangeStartEndReturns206() throws Exception {
        UUID id = UUID.randomUUID();
        StreamTarget target = target();
        when(streamService.resolve(id)).thenReturn(target);
        when(streamService.open(target.audioFile(), 0, 1000))
                .thenReturn(new ByteArrayInputStream(slice(0, 1000)));

        mockMvc.perform(get("/api/songs/{id}/stream", id).header(HttpHeaders.RANGE, "bytes=0-999"))
                .andExpect(status().isPartialContent())
                .andExpect(content().contentType("audio/mpeg"))
                .andExpect(header().string(HttpHeaders.CONTENT_RANGE, "bytes 0-999/" + TOTAL))
                .andExpect(header().longValue(HttpHeaders.CONTENT_LENGTH, 1000))
                .andExpect(content().bytes(slice(0, 1000)));

        verify(streamService).open(target.audioFile(), 0, 1000);
    }

    @Test
    void openEndedRangeReturnsRemainder() throws Exception {
        UUID id = UUID.randomUUID();
        StreamTarget target = target();
        when(streamService.resolve(id)).thenReturn(target);
        when(streamService.open(target.audioFile(), 1000, 1000))
                .thenReturn(new ByteArrayInputStream(slice(1000, 1000)));

        mockMvc.perform(get("/api/songs/{id}/stream", id).header(HttpHeaders.RANGE, "bytes=1000-"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string(HttpHeaders.CONTENT_RANGE, "bytes 1000-1999/" + TOTAL))
                .andExpect(header().longValue(HttpHeaders.CONTENT_LENGTH, 1000))
                .andExpect(content().bytes(slice(1000, 1000)));

        verify(streamService).open(target.audioFile(), 1000, 1000);
    }

    @Test
    void suffixRangeReturnsFinalBytes() throws Exception {
        UUID id = UUID.randomUUID();
        StreamTarget target = target();
        when(streamService.resolve(id)).thenReturn(target);
        when(streamService.open(target.audioFile(), 1500, 500))
                .thenReturn(new ByteArrayInputStream(slice(1500, 500)));

        mockMvc.perform(get("/api/songs/{id}/stream", id).header(HttpHeaders.RANGE, "bytes=-500"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string(HttpHeaders.CONTENT_RANGE, "bytes 1500-1999/" + TOTAL))
                .andExpect(header().longValue(HttpHeaders.CONTENT_LENGTH, 500))
                .andExpect(content().bytes(slice(1500, 500)));

        verify(streamService).open(target.audioFile(), 1500, 500);
    }

    @Test
    void invalidRangeReturns416WithContentRange() throws Exception {
        UUID id = UUID.randomUUID();
        stubResolve(id);

        mockMvc.perform(get("/api/songs/{id}/stream", id).header(HttpHeaders.RANGE, "bytes=2000-"))
                .andExpect(status().isRequestedRangeNotSatisfiable())
                .andExpect(header().string(HttpHeaders.CONTENT_RANGE, "bytes */" + TOTAL))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"));

        verify(streamService, never()).open(any(), anyLong(), anyLong());
    }

    @Test
    void songNotFoundReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(streamService.resolve(id))
                .thenThrow(new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + id));

        mockMvc.perform(get("/api/songs/{id}/stream", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SONG_NOT_FOUND"));
    }

    @Test
    void songWithoutAudioFileReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(streamService.resolve(id))
                .thenThrow(new NotFoundException(ErrorCode.AUDIO_NOT_FOUND, "No audio file"));

        mockMvc.perform(get("/api/songs/{id}/stream", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AUDIO_NOT_FOUND"));
    }

    @Test
    void missingStorageObjectReturnsStorageError() throws Exception {
        UUID id = UUID.randomUUID();
        when(streamService.resolve(id)).thenThrow(new StorageException("Audio object not found for key audio/1.mp3"));

        mockMvc.perform(get("/api/songs/{id}/stream", id))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("STORAGE_ERROR"));
    }

    @Test
    void contentTypeComesFromTarget() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile file = new AudioFile();
        file.setStorageKey("audio/1.wav");
        file.setFormat("wav");
        file.setContentType("audio/wav");
        StreamTarget wav = new StreamTarget(file, new AudioObjectInfo("audio/1.wav", 100, null), "audio/wav");
        when(streamService.resolve(id)).thenReturn(wav);
        when(streamService.open(file, 0, -1)).thenReturn(new ByteArrayInputStream(new byte[100]));

        mockMvc.perform(get("/api/songs/{id}/stream", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType("audio/wav"));
    }

    @Test
    void headReturnsHeadersWithoutBody() throws Exception {
        UUID id = UUID.randomUUID();
        stubResolve(id);

        mockMvc.perform(head("/api/songs/{id}/stream", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType("audio/mpeg"))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"))
                .andExpect(header().longValue(HttpHeaders.CONTENT_LENGTH, TOTAL))
                .andExpect(content().string(""));

        verify(streamService, never()).open(any(), anyLong(), anyLong());
    }
}
