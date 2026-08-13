# Audio Storage & Ingestion

Phase 4 adds upload of local audio files (MP3, FLAC, WAV, M4A, OGG), automatic
metadata extraction, deduplication, and out-of-database binary storage. This
document describes how the pieces fit together.

## 1. What is stored where

| Data | Location |
|---|---|
| Metadata (song/artist/album/audio file rows) | PostgreSQL via JPA entities |
| Audio bytes (the binary files) | Object storage, default a local directory (`./data/audio`) |
| Checksums, formats, bitrates, sample rates | `audio_file` columns in PostgreSQL |

Only metadata ever touches the database. The filesystem (or a future object
store) holds the bytes, and `audio_file.storage_key` records where each file
lives.

## 2. Storage abstraction

`com.softyfy.storage.AudioStorage` is the seam between the application and the
bytes:

```
interface AudioStorage {
    void store(String key, InputStream in, String contentType) throws IOException;
    void delete(String key) throws IOException;
    String resolveUrl(String key);
}
```

- The active implementation is selected from config
  (`SOFTYFY_STORAGE_PROVIDER`, default `local`) and the value is persisted on
  every `audio_file` row, so files uploaded via one provider are never confused
  with files from another.
- `LocalAudioStorage` writes via a temp file + atomic move, is idempotent on
  delete, and **rejects keys that could escape the root**: `..` segments,
  absolute paths, leading `/`, and backslashes.
- `resolveUrl` returns a `file:` URI for the local provider. Streaming audio to
  the browser is explicitly out of scope for this phase (playback is a later
  phase), so no content URLs are exposed yet.
- Swapping in S3/GCS later means implementing `AudioStorage` once and pointing
  the same keys at the new provider — nothing else changes.

## 3. Storage keys

Keys are `audio/{uuid}.{ext}`:

- The UUID is generated up front and assigned to the `AudioFile` id, so the key
  is known before the row exists and no key-to-row bookkeeping is needed.
- The extension is the validated file extension. `LocalAudioStorage` treats
  keys as opaque strings; only the character checks above are applied.

## 4. Upload flow

`POST /api/songs/upload` (multipart `file`, optional `title`/`artist`/`album`
overrides). The pipeline, in `SongIngestionService`:

1. **Validate** — `AudioFileValidator` runs on the stream:
   - size ≤ `SOFTYFY_AUDIO_MAX_FILE_SIZE_MB` (also enforced by Spring multipart limits)
   - extension ∈ {mp3, flac, wav, m4a, ogg}
   - magic bytes match the claimed extension (MP3 frame sync, RIFF/WAVE, `fLaC`, `ftyp`/M4A, OggS)
   - MIME type consistency (when the client supplies one)
2. **Extract metadata** — `AudioMetadataExtractor` reads the temp copy with
   jaudiotagger (`AudioFileIO.read`). The temp file keeps the original
   extension because jaudiotagger selects its reader by file extension.
   Extracted: title, artist, album, duration, format, bitrate, sample rate,
   channels, bit depth. A display `label` is derived (`24-bit/96 kHz` for lossless,
   `320 kbps` for lossy, only when real values were parsed). When the file
   cannot be parsed, the file name is used as a fallback title and the file is
   still accepted — a non-critical metadata parse never blocks an import.
3. **Checksum** — SHA-256 over the stream is the identity used for dedup.
4. **Dedup by checksum** — if a row with the same `sha256` exists, the song is
   returned with `created=false` and nothing is written or stored again.
5. **Store bytes** — `audioStorage.store(key, stream, contentType)`.
6. **Persist metadata** — `SongPersistenceService`:
   - resolves (or creates) the Album by normalized title;
   - resolves (or creates) Artists;
   - finds an existing Song by title + artist set + album + duration (±2 s); if
     found, the new `AudioFile` is attached as a **non-primary** file (a song
     can have many files); otherwise a new Song is created;
   - saves the `AudioFile` (or inserts it via the new repository).
7. **Response** — `UploadResult(song, created)`; HTTP 201 for a new song, 200
   for an already-imported one. Filesystem paths are never returned.

### Failure safety

- The temp file is deleted in a `finally` block.
- If DB persist fails after bytes are stored, the stored object is deleted
  (best effort, logged) and the exception is rethrown.
- Storage and DB are not atomic together — a crash between steps 5 and 6 can
  leave an orphan object. This is documented and accepted for the local
  provider; a future phase could add reconciliation.

## 5. Song resolution / deduplication rules

- **Same file uploaded twice** → SHA-256 match → 200, no duplicates. A partial
  unique index on `audio_file.sha256` guards concurrent uploads; a rare race can
  surface as HTTP 409.
- **Same song, different file** (e.g. two bitrates) → title/artist/album/duration
  match → second file is attached to the existing song as non-primary.
- Overrides (title/artist/album) win over extracted tags only when non-blank.

## 6. Deleting a song

`SongService.delete` loads the song with its audio files, deletes each stored
object (an `IOException` is logged and does not block the row deletion), then
deletes the row(s). Orphaned objects can only remain if the filesystem delete
fails; the DB row is removed regardless, keeping the library consistent.

## 7. Migration (V3)

`V3__audio_file_ingestion_metadata.sql` extends `audio_file` with the ingestion
metadata columns (`label`, `sample_rate_hz`, `channels`, `bit_depth`,
`content_type`, `sha256`) and adds:

- `uq_audio_file_sha256` — partial unique index on non-null `sha256`;
- `ix_audio_file_song_id_primary` — query support for the primary file lookup.

## 8. Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SOFTYFY_STORAGE_PROVIDER` | `local` | Storage backend, persisted per row |
| `SOFTYFY_STORAGE_LOCAL_ROOT` | `./data/audio` | Root dir for the local provider |
| `SOFTYFY_AUDIO_MAX_FILE_SIZE_MB` | `200` | Per-file upload cap, also sets Spring multipart limits |

The storage root is git-ignored (`data/`, `backend/data/`). Files live outside
the repository and the database.

## 9. Tests

- `AudioFileValidatorTest` — size/extension/magic-byte/MIME validation.
- `AudioMetadataExtractorTest` — parsing real WAV headers and the file-name fallback.
- `LocalAudioStorageTest` — write/delete/idempotency and path-traversal rejection.
- `SongIngestionServiceTest` — full pipeline incl. store-then-persist failure cleanup.
- `SongPersistenceServiceTest` — album/artist resolution, existing-song matching, dedup.
- `SongServiceTest` — delete removes objects even when storage cleanup fails.
- `SongControllerTest` — upload returns 201 (new) / 200 (already imported).

## 10. Known limitations

- Local filesystem provider only; streaming URLs and object-store backends are future work.
- Storage and DB writes are not atomic (orphan risk documented above).
- Against a real PostgreSQL instance the migration and the DB-backed upload path
  are not yet verified (no local Docker/PostgreSQL available during development).
