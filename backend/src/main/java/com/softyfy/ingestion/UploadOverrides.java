package com.softyfy.ingestion;

/**
 * Optional metadata overrides sent with an upload. Each field wins over the
 * corresponding metadata tag only when it is non-blank.
 */
public record UploadOverrides(String title, String artist, String album) {
}
