package com.softyfy.streaming;

import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.StorageException;
import com.softyfy.song.AudioFile;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import com.softyfy.storage.AudioObjectInfo;
import com.softyfy.storage.AudioStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AudioStreamServiceTest {

    private SongRepository songRepository;
    private AudioStorage audioStorage;
    private AudioStreamService service;

    @BeforeEach
    void setUp() {
        songRepository = mock(SongRepository.class);
        audioStorage = mock(AudioStorage.class);
        when(audioStorage.providerName()).thenReturn("local");
        service = new AudioStreamService(songRepository, audioStorage);
    }

    private AudioFile audioFile(String format, String contentType) {
        AudioFile file = new AudioFile();
        file.setStorageProvider("local");
        file.setStorageKey("audio/1.flac");
        file.setFormat(format);
        file.setContentType(contentType);
        file.setPrimary(true);
        return file;
    }

    private void stubSong(UUID id, List<AudioFile> files) {
        Song song = new Song("Song", null, List.of());
        files.forEach(song::addAudioFile);
        when(songRepository.findByIdWithGraph(id)).thenReturn(List.of(song));
    }

    @Test
    void resolvesPrimaryAudioFileWithStorageSize() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile file = audioFile("flac", "audio/flac");
        stubSong(id, List.of(file));
        when(audioStorage.providerName()).thenReturn("local");
        when(audioStorage.info("audio/1.flac")).thenReturn(new AudioObjectInfo("audio/1.flac", 42, null));

        StreamTarget target = service.resolve(id);

        assertThat(target.audioFile()).isSameAs(file);
        assertThat(target.objectInfo().size()).isEqualTo(42);
        assertThat(target.contentType()).isEqualTo("audio/flac");
    }

    @Test
    void fallsBackToNonPrimaryFileWhenNoPrimary() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile only = audioFile("mp3", "audio/mpeg");
        only.setPrimary(false);
        stubSong(id, List.of(only));
        when(audioStorage.info("audio/1.flac")).thenReturn(new AudioObjectInfo("audio/1.flac", 10, null));

        StreamTarget target = service.resolve(id);

        assertThat(target.audioFile()).isSameAs(only);
    }

    @Test
    void derivesContentTypeFromFormatWhenContentTypeMissing() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile file = audioFile("FLAC", null);
        stubSong(id, List.of(file));
        when(audioStorage.info("audio/1.flac")).thenReturn(new AudioObjectInfo("audio/1.flac", 10, null));

        StreamTarget target = service.resolve(id);

        assertThat(target.contentType()).isEqualTo("audio/flac");
    }

    @Test
    void fallsBackToOctetStreamForUnknownFormat() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile file = audioFile("opus", null);
        stubSong(id, List.of(file));
        when(audioStorage.info("audio/1.flac")).thenReturn(new AudioObjectInfo("audio/1.flac", 10, null));

        StreamTarget target = service.resolve(id);

        assertThat(target.contentType()).isEqualTo("application/octet-stream");
    }

    @Test
    void missingSongThrowsSongNotFound() {
        UUID id = UUID.randomUUID();
        when(songRepository.findByIdWithGraph(id)).thenReturn(List.of());

        assertThatThrownBy(() -> service.resolve(id))
                .isInstanceOfSatisfying(NotFoundException.class, ex -> {
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SONG_NOT_FOUND);
                    assertThat(ex.getStatus().value()).isEqualTo(404);
                });
    }

    @Test
    void songWithoutAudioFileThrowsAudioNotFound() {
        UUID id = UUID.randomUUID();
        stubSong(id, List.of());

        assertThatThrownBy(() -> service.resolve(id))
                .isInstanceOfSatisfying(NotFoundException.class, ex -> {
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.AUDIO_NOT_FOUND);
                    assertThat(ex.getStatus().value()).isEqualTo(404);
                });
    }

    @Test
    void missingStorageObjectThrowsStorageError() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile file = audioFile("mp3", "audio/mpeg");
        stubSong(id, List.of(file));
        when(audioStorage.providerName()).thenReturn("local");
        when(audioStorage.info("audio/1.flac")).thenThrow(new IOException("gone"));

        assertThatThrownBy(() -> service.resolve(id))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Could not read audio object metadata");
    }

    @Test
    void providerMismatchThrowsStorageError() throws Exception {
        UUID id = UUID.randomUUID();
        AudioFile file = audioFile("mp3", "audio/mpeg");
        file.setStorageProvider("s3");
        stubSong(id, List.of(file));
        when(audioStorage.providerName()).thenReturn("local");

        assertThatThrownBy(() -> service.resolve(id))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("provider mismatch");
    }

    @Test
    void openDelegatesToStorageWithOffsetAndLength() throws Exception {
        AudioFile file = audioFile("mp3", "audio/mpeg");
        InputStream stream = new ByteArrayInputStream(new byte[]{1, 2, 3});
        when(audioStorage.openStream("audio/1.flac", 5, 10)).thenReturn(stream);

        InputStream opened = service.open(file, 5, 10);

        assertThat(opened).isSameAs(stream);
        verify(audioStorage).openStream("audio/1.flac", 5, 10);
    }

    @Test
    void openWrapsStorageFailure() throws Exception {
        AudioFile file = audioFile("mp3", "audio/mpeg");
        when(audioStorage.openStream("audio/1.flac", 0, -1)).thenThrow(new IOException("boom"));

        assertThatThrownBy(() -> service.open(file, 0, -1))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Could not open audio stream");
    }
}
