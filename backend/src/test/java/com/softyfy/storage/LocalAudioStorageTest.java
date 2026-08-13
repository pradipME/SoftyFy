package com.softyfy.storage;

import com.softyfy.common.exception.StorageException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalAudioStorageTest {

    @TempDir
    Path tempDir;

    private LocalAudioStorage storage() {
        return new LocalAudioStorage(tempDir);
    }

    @Test
    void storesAndResolvesObject() throws Exception {
        LocalAudioStorage storage = storage();
        byte[] content = "audio-bytes".getBytes(StandardCharsets.UTF_8);

        storage.store("audio/1234.mp3", new ByteArrayInputStream(content), "audio/mpeg");

        Path stored = tempDir.resolve("audio").resolve("1234.mp3");
        assertThat(stored).exists();
        assertThat(Files.readAllBytes(stored)).isEqualTo(content);
        assertThat(storage.resolveUrl("audio/1234.mp3")).isNotEmpty();
    }

    @Test
    void deleteIsIdempotent() throws Exception {
        LocalAudioStorage storage = storage();
        storage.store("audio/1.mp3", new ByteArrayInputStream(new byte[]{1}), "audio/mpeg");

        storage.delete("audio/1.mp3");
        storage.delete("audio/1.mp3");

        assertThat(tempDir.resolve("audio").resolve("1.mp3")).doesNotExist();
    }

    @Test
    void rejectsPathTraversalKeys() {
        LocalAudioStorage storage = storage();

        assertThatThrownBy(() -> storage.store("../evil.mp3", new ByteArrayInputStream(new byte[]{1}), "audio/mpeg"))
                .isInstanceOf(StorageException.class);
        assertThatThrownBy(() -> storage.store("audio/..\\evil.mp3", new ByteArrayInputStream(new byte[]{1}), "audio/mpeg"))
                .isInstanceOf(StorageException.class);
        assertThatThrownBy(() -> storage.resolveUrl("/etc/passwd"))
                .isInstanceOf(StorageException.class);
    }

    @Test
    void rejectsAbsoluteWindowsPaths() {
        LocalAudioStorage storage = storage();

        assertThatThrownBy(() -> storage.resolveUrl("C:\\Windows\\system32"))
                .isInstanceOf(StorageException.class);
    }
}
