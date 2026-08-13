package com.softyfy.storage;

import com.softyfy.common.exception.StorageException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Local filesystem {@link AudioStorage} provider.
 *
 * <p>Keys are server-generated identifiers of the form {@code audio/<id>.<ext>}.
 * Every key is validated before use so user-supplied input can never escape the
 * configured root directory. Content is written via a temporary file followed by
 * an atomic move so readers never observe a partially written object.
 */
public class LocalAudioStorage implements AudioStorage {

    private static final Logger log = LoggerFactory.getLogger(LocalAudioStorage.class);

    private final Path root;

    public LocalAudioStorage(Path root) {
        this.root = root.toAbsolutePath().normalize();
    }

    @Override
    public String providerName() {
        return "local";
    }

    @Override
    public void store(String key, InputStream content, String contentType) throws IOException {
        Path target = resolve(key);
        Files.createDirectories(target.getParent());
        Path temp = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
        try (OutputStream out = Files.newOutputStream(temp)) {
            content.transferTo(out);
        } catch (IOException ex) {
            Files.deleteIfExists(temp);
            throw ex;
        }
        try {
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException ex) {
            Files.deleteIfExists(temp);
            throw ex;
        }
    }

    @Override
    public void delete(String key) throws IOException {
        Path target = resolve(key);
        if (Files.deleteIfExists(target)) {
            log.info("Deleted audio object {}", key);
        }
    }

    @Override
    public String resolveUrl(String key) {
        Path target = resolve(key);
        return target.toUri().toString();
    }

    /**
     * Maps a storage key to a path inside the root, rejecting any key that could
     * escape it.
     */
    private Path resolve(String key) {
        String normalizedKey = key.replace('\\', '/');
        if (normalizedKey.isBlank()
                || normalizedKey.startsWith("/")
                || normalizedKey.matches("^[A-Za-z]:.*")
                || normalizedKey.contains("..")) {
            throw new StorageException("Invalid storage key: " + key);
        }
        Path candidate = root.resolve(normalizedKey).normalize();
        if (!candidate.startsWith(root)) {
            throw new StorageException("Storage key escapes root: " + key);
        }
        return candidate;
    }
}
