package com.softyfy.streaming;

import com.softyfy.song.AudioFile;
import com.softyfy.storage.AudioObjectInfo;

/**
 * Resolved, ready-to-stream audio object for a song.
 *
 * @param audioFile   the playable {@link AudioFile} row
 * @param objectInfo  metadata from the storage provider (authoritative size)
 * @param contentType effective MIME type: the stored content type, falling back
 *                    to a format-derived type
 */
public record StreamTarget(AudioFile audioFile, AudioObjectInfo objectInfo, String contentType) {
}
