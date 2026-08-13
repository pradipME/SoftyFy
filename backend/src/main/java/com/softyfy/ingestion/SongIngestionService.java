package com.softyfy.ingestion;

import com.softyfy.common.exception.StorageException;
import com.softyfy.song.AudioFile;
import com.softyfy.song.AudioFileRepository;
import com.softyfy.song.Song;
import com.softyfy.song.SongMapper;
import com.softyfy.song.SongRepository;
import com.softyfy.storage.AudioProperties;
import com.softyfy.storage.AudioStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Orchestrates the end-to-end upload pipeline: validate, buffer to a temp file,
 * extract metadata, hash for duplicate detection, store the object file, then
 * persist the library records in a transaction.
 *
 * <p>The object file and the database are not updated atomically. Ordering is
 * chosen so a database failure cleans up the stored object file; a failure
 * after commit is not rolled back, which is documented in
 * {@code docs/STORAGE_ARCHITECTURE.md}.
 */
@Service
public class SongIngestionService {

    private static final Logger log = LoggerFactory.getLogger(SongIngestionService.class);
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "mp3", "audio/mpeg",
            "flac", "audio/flac",
            "wav", "audio/wav",
            "m4a", "audio/mp4",
            "ogg", "audio/ogg");

    private final AudioStorage audioStorage;
    private final AudioProperties audioProperties;
    private final AudioMetadataExtractor metadataExtractor;
    private final AudioFileRepository audioFileRepository;
    private final SongRepository songRepository;
    private final SongPersistenceService persistenceService;

    public SongIngestionService(AudioStorage audioStorage, AudioProperties audioProperties,
                                AudioMetadataExtractor metadataExtractor,
                                AudioFileRepository audioFileRepository,
                                SongRepository songRepository,
                                SongPersistenceService persistenceService) {
        this.audioStorage = audioStorage;
        this.audioProperties = audioProperties;
        this.metadataExtractor = metadataExtractor;
        this.audioFileRepository = audioFileRepository;
        this.songRepository = songRepository;
        this.persistenceService = persistenceService;
    }

    public UploadResult ingest(MultipartFile file, UploadOverrides overrides) {
        AudioFileValidator.validate(file, audioProperties);
        String extension = AudioFileValidator.extensionOf(file.getOriginalFilename());
        String contentType = CONTENT_TYPES.getOrDefault(extension, "application/octet-stream");
        try {
            Path temp = Files.createTempFile("softyfy-upload-", "." + extension);
            try {
                copyToTemp(file, temp);
                AudioMetadata metadata = metadataExtractor.extract(temp, file.getOriginalFilename());
                String sha256 = sha256(temp);
                Optional<AudioFile> duplicate = audioFileRepository.findBySha256(sha256);
                if (duplicate.isPresent()) {
                    return new UploadResult(toDto(duplicate.get().getSong().getId()), false);
                }
                AudioFile audioFile = buildAudioFile(metadata, file.getSize(), sha256, contentType);
                String key = audioFile.getStorageKey();
                try (InputStream in = Files.newInputStream(temp)) {
                    audioStorage.store(key, in, contentType);
                } catch (IOException ex) {
                    throw new StorageException("Failed to store audio file", ex);
                }
                try {
                    Song song = persistenceService.persist(audioFile, metadata, overrides);
                    return new UploadResult(toDto(song.getId()), true);
                } catch (RuntimeException ex) {
                    logFailureToCleanup(key, ex);
                    throw ex;
                }
            } finally {
                Files.deleteIfExists(temp);
            }
        } catch (IOException ex) {
            throw new StorageException("Failed to process audio upload", ex);
        }
    }

    private void copyToTemp(MultipartFile file, Path temp) throws IOException {
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, temp, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private AudioFile buildAudioFile(AudioMetadata metadata, long sizeBytes, String sha256, String contentType) {
        UUID id = UUID.randomUUID();
        AudioFile audioFile = new AudioFile();
        audioFile.setId(id);
        audioFile.setStorageProvider(audioStorage.providerName());
        audioFile.setStorageKey("audio/" + id + "." + metadata.format());
        audioFile.setFormat(metadata.format());
        audioFile.setLabel(metadata.label());
        audioFile.setBitrateKbps(metadata.bitrateKbps());
        audioFile.setSampleRateHz(metadata.sampleRateHz());
        audioFile.setChannels(metadata.channels());
        audioFile.setBitDepth(metadata.bitDepth());
        audioFile.setSizeBytes(sizeBytes);
        audioFile.setContentType(contentType);
        audioFile.setSha256(sha256);
        audioFile.setPrimary(true);
        return audioFile;
    }

    private com.softyfy.song.dto.SongDto toDto(UUID songId) {
        return songRepository.findByIdWithGraph(songId).stream()
                .findFirst()
                .map(SongMapper::toDto)
                .orElseThrow(() -> new IllegalStateException("Song disappeared after ingestion: " + songId));
    }

    private String sha256(Path file) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private void logFailureToCleanup(String key, RuntimeException cause) {
        try {
            audioStorage.delete(key);
            log.info("Removed stored object {} after failed database persist", key);
        } catch (IOException ex) {
            log.warn("Could not remove stored object {} after failed database persist", key, ex);
        }
    }
}
