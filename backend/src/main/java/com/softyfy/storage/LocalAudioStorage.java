package com.softyfy.storage;

import com.softyfy.common.exception.StorageException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;

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
    public AudioObjectInfo info(String key) throws IOException {
        Path target = resolve(key);
        if (!Files.isRegularFile(target)) {
            throw new StorageException("Audio object not found for key " + key);
        }
        return new AudioObjectInfo(key, Files.size(target), null);
    }

    @Override
    public InputStream openStream(String key, long offset, long length) throws IOException {
        Path target = resolve(key);
        if (!Files.isRegularFile(target)) {
            throw new StorageException("Audio object not found for key " + key);
        }
        if (offset < 0) {
            throw new StorageException("Invalid stream offset for key " + key);
        }
        FileChannel channel = FileChannel.open(target, StandardOpenOption.READ);
        boolean failure = true;
        try {
            channel.position(offset);
            InputStream in = Channels.newInputStream(channel);
            failure = false;
            return length >= 0 ? new LimitedInputStream(in, length) : in;
        } finally {
            if (failure) {
                channel.close();
            }
        }
    }

    @Override
    public String resolveUrl(String key) {
        Path target = resolve(key);
        return target.toUri().toString();
    }

    /**
     * Caps the number of bytes a stream yields, so a caller reading a range
     * never pulls more of the underlying file than requested.
     */
    private static final class LimitedInputStream extends FilterInputStream {

        private final long limit;
        private long readCount;

        LimitedInputStream(InputStream in, long limit) {
            super(in);
            this.limit = limit;
        }

        @Override
        public int read() throws IOException {
            if (readCount >= limit) {
                return -1;
            }
            int b = super.read();
            if (b != -1) {
                readCount++;
            }
            return b;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            long remaining = limit - readCount;
            if (remaining <= 0) {
                return -1;
            }
            int max = (int) Math.min(len, remaining);
            int n = super.read(b, off, max);
            if (n != -1) {
                readCount += n;
            }
            return n;
        }

        @Override
        public long skip(long n) throws IOException {
            long max = Math.min(n, limit - readCount);
            long skipped = super.skip(max);
            readCount += skipped;
            return skipped;
        }

        @Override
        public int available() throws IOException {
            long remaining = limit - readCount;
            return (int) Math.min(super.available(), Math.max(remaining, 0));
        }
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
