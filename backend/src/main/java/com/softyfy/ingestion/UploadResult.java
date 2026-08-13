package com.softyfy.ingestion;

import com.softyfy.song.dto.SongDto;

/**
 * Outcome of an upload request.
 *
 * @param song    the song that owns the ingested audio file
 * @param created true when a brand new song was created, false when the file
 *                was already imported (matched by checksum) and the existing
 *                song is returned
 */
public record UploadResult(SongDto song, boolean created) {
}
