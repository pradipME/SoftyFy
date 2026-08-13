package com.softyfy.storage;

/**
 * Metadata about a stored audio object. Content type is provider-specific;
 * a provider that does not persist it (e.g. the local filesystem) returns
 * {@code null}, and callers fall back to {@code AudioFile} metadata.
 */
public record AudioObjectInfo(String key, long size, String contentType) {
}
