package com.softyfy.storage;

import java.io.IOException;
import java.io.InputStream;

/**
 * Boundary for audio object storage. Concrete providers (e.g. local disk,
 * S3, etc.) are implemented in a later phase.
 */
public interface AudioStorage {

    /**
     * @return a stable identifier of the provider, persisted in audio_file.storage_provider
     */
    String providerName();

    /**
     * Stores the given content under the given key.
     *
     * @throws IOException if the operation fails
     */
    void store(String key, InputStream content, String contentType) throws IOException;

    /**
     * Deletes the object stored under the given key.
     *
     * @throws IOException if the operation fails
     */
    void delete(String key) throws IOException;

    /**
     * Returns metadata about the object stored under the given key.
     *
     * @throws IOException if the object is missing or the operation fails
     */
    AudioObjectInfo info(String key) throws IOException;

    /**
     * Opens a streaming view of the object stored under the given key,
     * positioned at {@code offset} bytes from the start of the object.
     *
     * <p>When {@code length} is {@code >= 0}, the returned stream yields at most
     * {@code length} bytes and then reports end-of-stream; when negative it
     * yields through the end of the object. The object is never loaded fully
     * into memory - only the requested range is ever read.
     *
     * @throws IOException if the object is missing or the operation fails
     */
    InputStream openStream(String key, long offset, long length) throws IOException;

    /**
     * Returns a resolvable URL for the object stored under the given key.
     */
    String resolveUrl(String key);
}
