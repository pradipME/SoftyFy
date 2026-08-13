package com.softyfy.ingestion;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class AudioMetadataExtractorTest {

    private final AudioMetadataExtractor extractor = new AudioMetadataExtractor();

    @TempDir
    Path tempDir;

    @Test
    void extractsTechnicalFieldsFromSyntheticWav() throws Exception {
        Path file = tempDir.resolve("track.wav");
        Files.write(file, syntheticWav(2, 44100, 16, 1));

        AudioMetadata metadata = extractor.extract(file, "track.wav");

        assertThat(metadata.title()).isEqualTo("track");
        assertThat(metadata.artistNames()).containsExactly("Unknown Artist");
        assertThat(metadata.format()).isEqualTo("wav");
        assertThat(metadata.sampleRateHz()).isEqualTo(44100);
        assertThat(metadata.channels()).isEqualTo(2);
        assertThat(metadata.bitDepth()).isEqualTo(16);
        assertThat(metadata.durationSeconds()).isEqualTo(1);
    }

    @Test
    void fallsBackToFileNameWhenFileCannotBeParsed() throws Exception {
        Path file = tempDir.resolve("broken.mp3");
        Files.write(file, new byte[]{(byte) 0xFF, (byte) 0xFF, 0, 0, 0, 0, 0, 0});

        AudioMetadata metadata = extractor.extract(file, "broken.mp3");

        assertThat(metadata.title()).isEqualTo("broken");
        assertThat(metadata.artistNames()).containsExactly("Unknown Artist");
        assertThat(metadata.format()).isEqualTo("mp3");
    }

    private byte[] syntheticWav(int channels, int sampleRate, int bitsPerSample, int durationSeconds) {
        int dataSize = sampleRate * channels * (bitsPerSample / 8) * durationSeconds;
        ByteBuffer buffer = ByteBuffer.allocate(44 + dataSize).order(ByteOrder.LITTLE_ENDIAN);
        buffer.put("RIFF".getBytes());
        buffer.putInt(36 + dataSize);
        buffer.put("WAVE".getBytes());
        buffer.put("fmt ".getBytes());
        buffer.putInt(16);
        buffer.putShort((short) 1);
        buffer.putShort((short) channels);
        buffer.putInt(sampleRate);
        buffer.putInt(sampleRate * channels * (bitsPerSample / 8));
        buffer.putShort((short) (channels * (bitsPerSample / 8)));
        buffer.putShort((short) bitsPerSample);
        buffer.put("data".getBytes());
        buffer.putInt(dataSize);
        return buffer.array();
    }
}
