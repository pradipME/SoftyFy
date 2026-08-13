package com.softyfy.storage;

import com.softyfy.common.exception.StorageException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
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

    private static byte[] numberedBytes(int size) {
        byte[] bytes = new byte[size];
        for (int i = 0; i < size; i++) {
            bytes[i] = (byte) i;
        }
        return bytes;
    }

    @Test
    void infoReturnsObjectSize() throws Exception {
        LocalAudioStorage storage = storage();
        byte[] content = numberedBytes(1234);
        storage.store("audio/1.mp3", new ByteArrayInputStream(content), "audio/mpeg");

        AudioObjectInfo info = storage.info("audio/1.mp3");

        assertThat(info.size()).isEqualTo(1234);
        assertThat(info.key()).isEqualTo("audio/1.mp3");
    }

    @Test
    void infoOnMissingObjectThrowsStorageException() {
        LocalAudioStorage storage = storage();

        assertThatThrownBy(() -> storage.info("audio/missing.mp3"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void openStreamReturnsRequestedRange() throws Exception {
        LocalAudioStorage storage = storage();
        storage.store("audio/1.mp3", new ByteArrayInputStream(numberedBytes(100)), "audio/mpeg");

        try (InputStream in = storage.openStream("audio/1.mp3", 10, 20)) {
            byte[] read = in.readAllBytes();
            assertThat(read).hasSize(20);
            assertThat(read[0]).isEqualTo((byte) 10);
            assertThat(read[19]).isEqualTo((byte) 29);
        }
    }

    @Test
    void openStreamReadsToEofWhenLengthNegative() throws Exception {
        LocalAudioStorage storage = storage();
        storage.store("audio/1.mp3", new ByteArrayInputStream(numberedBytes(50)), "audio/mpeg");

        try (InputStream in = storage.openStream("audio/1.mp3", 40, -1)) {
            byte[] read = in.readAllBytes();
            assertThat(read).hasSize(10);
            assertThat(read[0]).isEqualTo((byte) 40);
            assertThat(read[9]).isEqualTo((byte) 49);
        }
    }

    @Test
    void openStreamOnlyReadsRequestedBytesFromLargeFile() throws Exception {
        LocalAudioStorage storage = storage();
        byte[] full = numberedBytes(5_000_000);
        storage.store("audio/1.mp3", new ByteArrayInputStream(full), "audio/mpeg");

        try (InputStream in = storage.openStream("audio/1.mp3", 1_000_000, 100)) {
            byte[] read = in.readAllBytes();
            assertThat(read).hasSize(100);
            assertThat(read).isEqualTo(java.util.Arrays.copyOfRange(full, 1_000_000, 1_000_100));
        }
    }

    @Test
    void openStreamOnMissingObjectThrowsStorageException() {
        LocalAudioStorage storage = storage();

        assertThatThrownBy(() -> storage.openStream("audio/missing.mp3", 0, -1))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void openStreamRejectsPathTraversalKeys() {
        LocalAudioStorage storage = storage();

        assertThatThrownBy(() -> storage.openStream("../evil.mp3", 0, -1))
                .isInstanceOf(StorageException.class);
        assertThatThrownBy(() -> storage.openStream("audio/..\\evil.mp3", 0, -1))
                .isInstanceOf(StorageException.class);
    }

    @Test
    void closedStreamsReleaseFileHandlesSoDeletionSucceeds() throws Exception {
        LocalAudioStorage storage = storage();
        storage.store("audio/1.mp3", new ByteArrayInputStream(numberedBytes(100)), "audio/mpeg");

        for (int i = 0; i < 5; i++) {
            try (InputStream ignored = storage.openStream("audio/1.mp3", i * 10, 5)) {
                // read fully
            }
        }

        storage.delete("audio/1.mp3");
        assertThat(tempDir.resolve("audio").resolve("1.mp3")).doesNotExist();
    }
}
