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
     * Returns a resolvable URL for the object stored under the given key.
     */
    String resolveUrl(String key);
}
