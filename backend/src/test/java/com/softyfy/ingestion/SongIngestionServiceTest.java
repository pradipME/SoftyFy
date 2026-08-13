package com.softyfy.ingestion;

import com.softyfy.common.exception.StorageException;
import com.softyfy.song.AudioFile;
import com.softyfy.song.AudioFileRepository;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import com.softyfy.storage.AudioProperties;
import com.softyfy.storage.AudioStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SongIngestionServiceTest {

    @Mock
    private AudioStorage audioStorage;
    @Mock
    private AudioMetadataExtractor metadataExtractor;
    @Mock
    private AudioFileRepository audioFileRepository;
    @Mock
    private SongRepository songRepository;
    @Mock
    private SongPersistenceService persistenceService;

    private final AudioProperties audioProperties = new AudioProperties();

    private SongIngestionService service;

    @BeforeEach
    void setUp() {
        service = new SongIngestionService(audioStorage, audioProperties, metadataExtractor,
                audioFileRepository, songRepository, persistenceService);
    }

    private MockMultipartFile mp3(String name, byte[] content) {
        return new MockMultipartFile("file", name, "audio/mpeg", content);
    }

    private byte[] validMp3Content() {
        return new byte[]{'I', 'D', '3', 0, 0, 0, 0, 0, 0, 0, 0, 0};
    }

    private AudioMetadata metadata() {
        return new AudioMetadata("Song", List.of("Artist"), "Album", "Artist", 2020, 200,
                1, null, 320, 44100, 2, 16, "mp3", "320 kbps");
    }

    @Test
    void storesObjectThenPersistsNewSong() throws Exception {
        when(audioFileRepository.findBySha256(any())).thenReturn(Optional.empty());
        when(metadataExtractor.extract(any(), any())).thenReturn(metadata());
        Song persisted = new Song("Song", null, List.of());
        when(persistenceService.persist(any(), any(), any())).thenReturn(persisted);
        when(songRepository.findByIdWithGraph(any())).thenReturn(List.of(persisted));

        MockMultipartFile file = mp3("song.mp3", validMp3Content());
        UploadResult result = service.ingest(file, new UploadOverrides(null, null, null));

        ArgumentCaptor<AudioFile> audioFileCaptor = ArgumentCaptor.forClass(AudioFile.class);
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(audioStorage).store(keyCaptor.capture(), any(), any());
        verify(persistenceService).persist(audioFileCaptor.capture(), any(), any());

        assertThat(result.created()).isTrue();
        assertThat(keyCaptor.getValue()).matches("audio/[0-9a-f-]+\\.mp3");
        assertThat(audioFileCaptor.getValue().getStorageKey()).isEqualTo(keyCaptor.getValue());
        assertThat(audioFileCaptor.getValue().getSha256()).isNotBlank();
        assertThat(audioFileCaptor.getValue().isPrimary()).isTrue();
    }

    @Test
    void duplicateChecksumSkipsStorageAndReturnsExistingSong() throws Exception {
        Song existing = new Song("Song", null, List.of());
        AudioFile duplicate = new AudioFile(existing, "local", "audio/1.mp3", "mp3", 320, 1000L, true);
        when(audioFileRepository.findBySha256(any())).thenReturn(Optional.of(duplicate));
        when(songRepository.findByIdWithGraph(any())).thenReturn(List.of(existing));

        MockMultipartFile file = mp3("song.mp3", validMp3Content());
        UploadResult result = service.ingest(file, new UploadOverrides(null, null, null));

        assertThat(result.created()).isFalse();
        assertThat(result.song().title()).isEqualTo("Song");
        verify(audioStorage, never()).store(any(), any(), any());
        verify(persistenceService, never()).persist(any(), any(), any());
    }

    @Test
    void storageFailureDoesNotPersist() throws Exception {
        when(audioFileRepository.findBySha256(any())).thenReturn(Optional.empty());
        when(metadataExtractor.extract(any(), any())).thenReturn(metadata());
        org.mockito.Mockito.doThrow(new IOException("disk full"))
                .when(audioStorage).store(any(), any(), any());

        MockMultipartFile file = mp3("song.mp3", validMp3Content());
        assertThatThrownBy(() -> service.ingest(file, new UploadOverrides(null, null, null)))
                .isInstanceOf(StorageException.class);

        verify(persistenceService, never()).persist(any(), any(), any());
        verify(audioStorage, never()).delete(any());
    }

    @Test
    void databaseFailureDeletesStoredObjectAndRethrows() throws Exception {
        when(audioFileRepository.findBySha256(any())).thenReturn(Optional.empty());
        when(metadataExtractor.extract(any(), any())).thenReturn(metadata());
        when(persistenceService.persist(any(), any(), any())).thenThrow(new RuntimeException("db down"));

        MockMultipartFile file = mp3("song.mp3", validMp3Content());
        assertThatThrownBy(() -> service.ingest(file, new UploadOverrides(null, null, null)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("db down");

        verify(audioStorage).delete(any());
    }
}
