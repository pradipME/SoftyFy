package com.softyfy.streaming;

import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.StorageException;
import com.softyfy.song.AudioFile;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import com.softyfy.storage.AudioStorage;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Resolves a song to a playable audio object and opens byte-range views of it.
 * The service works exclusively against the {@link AudioStorage} abstraction;
 * filesystem details never leave the storage implementation.
 */
@Service
public class AudioStreamService {

    private static final Map<String, String> FORMAT_MIME_TYPES = Map.of(
            "mp3", "audio/mpeg",
            "flac", "audio/flac",
            "wav", "audio/wav",
            "m4a", "audio/mp4",
            "ogg", "audio/ogg");

    private final SongRepository songRepository;
    private final AudioStorage audioStorage;

    public AudioStreamService(SongRepository songRepository, AudioStorage audioStorage) {
        this.songRepository = songRepository;
        this.audioStorage = audioStorage;
    }

    /**
     * Resolves the playable audio object for a song.
     *
     * @throws NotFoundException when the song or its audio file does not exist
     * @throws StorageException  when the stored object is missing or unreadable
     */
    public StreamTarget resolve(UUID songId) {
        Song song = songRepository.findByIdWithGraph(songId).stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + songId));

        AudioFile audioFile = song.getAudioFiles().stream()
                .filter(AudioFile::isPrimary)
                .findFirst()
                .or(() -> song.getAudioFiles().stream().findFirst())
                .orElseThrow(() -> new NotFoundException(ErrorCode.AUDIO_NOT_FOUND,
                        "Song has no playable audio file: " + songId));

        if (audioFile.getStorageProvider() != null
                && !audioFile.getStorageProvider().equals(audioStorage.providerName())) {
            throw new StorageException("Audio object provider mismatch for song " + songId);
        }

        try {
            return new StreamTarget(audioFile,
                    audioStorage.info(audioFile.getStorageKey()),
                    contentTypeFor(audioFile));
        } catch (IOException ex) {
            throw new StorageException("Could not read audio object metadata for song " + songId, ex);
        }
    }

    /**
     * Opens a streaming view of the object. {@code length < 0} streams through
     * the end of the object; otherwise exactly the requested range is readable.
     */
    public InputStream open(AudioFile audioFile, long offset, long length) {
        try {
            return audioStorage.openStream(audioFile.getStorageKey(), offset, length);
        } catch (IOException ex) {
            throw new StorageException("Could not open audio stream for object " + audioFile.getStorageKey(), ex);
        }
    }

    private String contentTypeFor(AudioFile audioFile) {
        if (audioFile.getContentType() != null && !audioFile.getContentType().isBlank()) {
            return audioFile.getContentType();
        }
        if (audioFile.getFormat() != null) {
            String mime = FORMAT_MIME_TYPES.get(audioFile.getFormat().toLowerCase(Locale.ROOT));
            if (mime != null) {
                return mime;
            }
        }
        return "application/octet-stream";
    }
}
