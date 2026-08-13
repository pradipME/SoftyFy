package com.softyfy.ingestion;

import com.softyfy.common.exception.ApiException;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.storage.AudioProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AudioFileValidatorTest {

    private final AudioProperties properties = new AudioProperties();

    @Test
    void acceptsValidMp3WithId3Header() {
        MockMultipartFile file = new MockMultipartFile("file", "song.mp3", "audio/mpeg",
                new byte[]{'I', 'D', '3', 0, 0, 0, 0, 0, 0, 0, 0, 0});

        AudioFileValidator.validate(file, properties);
    }

    @Test
    void acceptsValidMp3WithFrameSync() {
        MockMultipartFile file = new MockMultipartFile("file", "song.mp3", "audio/mpeg",
                new byte[]{(byte) 0xFF, (byte) 0xFB, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0});

        AudioFileValidator.validate(file, properties);
    }

    @Test
    void acceptsValidFlac() {
        MockMultipartFile file = new MockMultipartFile("file", "song.flac", "audio/flac",
                new byte[]{'f', 'L', 'a', 'C', 0, 0, 0, 0, 0, 0, 0, 0});

        AudioFileValidator.validate(file, properties);
    }

    @Test
    void acceptsValidWav() {
        byte[] head = new byte[12];
        System.arraycopy("RIFF".getBytes(), 0, head, 0, 4);
        System.arraycopy("WAVE".getBytes(), 0, head, 8, 4);
        MockMultipartFile file = new MockMultipartFile("file", "song.wav", "audio/wav", head);

        AudioFileValidator.validate(file, properties);
    }

    @Test
    void acceptsValidM4a() {
        byte[] head = new byte[12];
        System.arraycopy("ftyp".getBytes(), 0, head, 4, 4);
        MockMultipartFile file = new MockMultipartFile("file", "song.m4a", "audio/mp4", head);

        AudioFileValidator.validate(file, properties);
    }

    @Test
    void acceptsValidOgg() {
        MockMultipartFile file = new MockMultipartFile("file", "song.ogg", "audio/ogg",
                new byte[]{'O', 'g', 'g', 'S', 0, 0, 0, 0, 0, 0, 0, 0});

        AudioFileValidator.validate(file, properties);
    }

    @Test
    void rejectsUnsupportedExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "song.exe", "application/octet-stream",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12});

        assertThatThrownBy(() -> AudioFileValidator.validate(file, properties))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getErrorCode())
                        .isEqualTo(ErrorCode.UNSUPPORTED_MEDIA_TYPE));
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile("file", "song.mp3", "audio/mpeg", new byte[0]);

        assertThatThrownBy(() -> AudioFileValidator.validate(file, properties))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_FILE));
    }

    @Test
    void rejectsOversizedFile() {
        AudioProperties small = new AudioProperties();
        small.setMaxFileSizeMb(1);
        byte[] content = new byte[2 * 1024 * 1024];
        content[0] = 'I';
        content[1] = 'D';
        content[2] = '3';
        MockMultipartFile file = new MockMultipartFile("file", "song.mp3", "audio/mpeg", content);

        assertThatThrownBy(() -> AudioFileValidator.validate(file, small))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getErrorCode())
                        .isEqualTo(ErrorCode.FILE_TOO_LARGE));
    }

    @Test
    void rejectsContentMismatchingExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "song.mp3", "audio/mpeg",
                new byte[]{'f', 'L', 'a', 'C', 0, 0, 0, 0, 0, 0, 0, 0});

        assertThatThrownBy(() -> AudioFileValidator.validate(file, properties))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_FILE));
    }

    @Test
    void rejectsPathTraversalFilename() {
        MockMultipartFile file = new MockMultipartFile("file", "../../song.mp3", "audio/mpeg",
                new byte[]{'I', 'D', '3', 0, 0, 0, 0, 0, 0, 0, 0, 0});

        assertThatThrownBy(() -> AudioFileValidator.validate(file, properties))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_FILE));
    }
}
