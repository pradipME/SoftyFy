# Audio Streaming & HTTP Range Support

Phase 5 makes uploaded audio playable in the browser. Stored objects are served
over HTTP with correct [RFC 7233](https://www.rfc-editor.org/rfc/rfc7233) Range
support, so a native `<audio>` element can stream, pause, and seek without ever
loading a whole file into memory.

```
Song → AudioFile → AudioStorage → GET /api/songs/{id}/stream → browser <audio>
```

## 1. Streaming endpoint

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/songs/{id}/stream` | Stream the song's primary audio object, honoring a single `bytes` range |
| HEAD | `/api/songs/{id}/stream` | Metadata headers only (size, type, Accept-Ranges), no body |

The endpoint accepts only a valid Song UUID. There is no query-string or path
based file selection — the storage key comes from the resolved `AudioFile` row.

## 2. Storage abstraction

`AudioStorage` grew two read-side operations (see `docs/STORAGE_ARCHITECTURE.md`
for the write side):

```
AudioObjectInfo info(String key)                    // size (+ provider content type, may be null)
InputStream    openStream(key, offset, length)      // seeked, length-capped view of the object
```

- `LocalAudioStorage` implements them with `FileChannel` positioning
  (`channel.position(offset)`), a `Channels.newInputStream(...)` bridge, and a
  `LimitedInputStream` that stops yielding after `length` bytes. `length < 0`
  means "through EOF".
- The stream wrapper is thin: bytes are read on demand from the kernel. No
  `byte[]` proportional to the file is ever allocated; `Files.readAllBytes`
  is never used for streaming.
- Opening a stream is lazy and validated. Closing the stream (Spring does this
  after the response is written) closes the underlying channel and file handle.
- The abstraction still exposes no filesystem `Path`s; the service layer only
  ever deals with keys and streams.

`AudioStreamService` resolves a song to a `StreamTarget`:

1. load the `Song` (404 `SONG_NOT_FOUND` if missing);
2. pick the primary `AudioFile` (falling back to the first file; 404
   `AUDIO_NOT_FOUND` if the song has none);
3. verify the row's `storage_provider` matches the active provider;
4. fetch authoritative size via `audioStorage.info(key)`;
5. compute the effective MIME type (stored `content_type`, else derived from
   `format`, else `application/octet-stream`).

## 3. Range parsing

`RangeParser` is a small, dependency-free component (independently unit-tested):

| Header | Interpretation |
| --- | --- |
| `bytes=start-end` | end clamped to `total-1`; rejected when `start >= total` or `end < start` |
| `bytes=start-` | `start` through `total-1` |
| `bytes=-N` | the final `N` bytes (`start = max(0, total - N)`) |
| absent / blank | no range → full object |

Anything else — unknown unit, multiple ranges (`a,b`), non-numeric values,
empty spec, `-0` suffix, ranges on an empty object — raises `InvalidRangeException`
(HTTP 416). **Multipart/byteranges is intentionally not implemented**: browser
audio seeking only ever issues a single range, so multiple ranges are rejected
rather than served as `multipart/byteranges`.

## 4. HTTP status behavior

| Request | Status |
| --- | --- |
| no `Range` header | **200 OK** — full object, streamed incrementally |
| satisfiable single `bytes` range | **206 Partial Content** |
| unsatisfiable / malformed range | **416 Range Not Satisfiable** |
| unknown song | **404** (`SONG_NOT_FOUND` ProblemDetail) |
| song without audio file | **404** (`AUDIO_NOT_FOUND` ProblemDetail) |
| stored object missing / unreadable | **500** (`STORAGE_ERROR` ProblemDetail) |
| unknown unit / multiple ranges | **416** |

For the 416 case the response is deliberately **not** a JSON body: it carries
`Content-Range: bytes */TOTAL` (and `Accept-Ranges: bytes`) with an empty body,
so media clients receive a standards-compliant response. JSON `ProblemDetail`
bodies are used only for 404/500, which are not media responses.

## 5. Headers

| Header | 200 | 206 | 416 |
| --- | --- | --- | --- |
| `Content-Type` | effective MIME type | effective MIME type | — |
| `Content-Length` | `total` | `end - start + 1` | — |
| `Accept-Ranges` | `bytes` | `bytes` | `bytes` |
| `Content-Range` | — | `bytes start-end/total` | `bytes */total` |
| `Cache-Control` | `public, max-age=31536000, immutable` | same | — |

`Content-Disposition: attachment` is never used — the browser treats the
response as streamable media.

## 6. Caching decision

`Cache-Control: public, max-age=31536000, immutable` is applied because:

- storage keys are server-generated UUIDs (`audio/{uuid}.{ext}`) and objects are
  written via temp-file + atomic move, so they are **immutable** — a URL never
  changes its bytes;
- this is a single-user personal application with no authentication today, so a
  public cache is safe.

**Revisit when auth arrives:** any future authenticated/private access must
switch to `private` (or no-cache) — a note is left in the controller for that
reason. No other cache-related risk exists in the current architecture.

## 7. Security

- The endpoint accepts only a `Song` UUID; the storage key is resolved from the
  database, never from the request. `GET /api/songs/../../...` style traversal
  is structurally impossible (a UUID is not a path).
- `LocalAudioStorage` still validates every key against the configured root
  (`..` segments, absolute paths, leading `/`, backslashes, drive letters are
  rejected) before opening anything.
- API responses and storage errors never include filesystem paths; messages
  reference storage keys only.

## 8. Performance

- `FileChannel` + seek + limited read: only the requested bytes are pulled from
  disk, incrementally, and written straight to the servlet output stream.
- No full-file buffering, no byte arrays proportional to the file, no reactive
  stack — plain Spring MVC streaming, which comfortably handles the 200 MB
  upload ceiling.
- Repeated/seeking requests open and close independent handles; closing the
  stream closes the channel (verified by a test that deletes the file after
  many range reads).

## 9. Frontend integration (minimal, Phase 5)

`src/lib/stream.ts` exposes `streamUrl(songId)`. It was first proven by a
temporary per-row `TestPlayButton` (a hidden `<audio>` element hitting the
stream endpoint); that button has since been replaced by the full Phase 6
player. The single global player in `src/state/PlayerContext.tsx` now drives
one `HTMLAudioElement` whose `src` is built from `streamUrl`, so the streaming
endpoint, range requests, and seeking are consumed exactly as designed here.
See `docs/PLAYER_ARCHITECTURE.md` for the player design.

No CORS changes were needed: the `<audio>` element performs a simple (non-
preflight) GET, and `spring.web.cors.allowed-methods` already includes GET. The
native audio element also does not require the browser to read response headers,
so `exposed-headers` stays unconfigured.

## 10. Original bytes, unchanged

Streaming is pure pass-through: the exact stored bytes of the original MP3 /
FLAC / WAV / M4A / OGG are served. No transcoding, re-encoding, resampling,
or bitrate conversion happens anywhere.

## 11. Future player architecture (Phase 6, not built)

The endpoint is designed so a later player can:

- set `audio.src = streamUrl(songId)` and get seeking for free (206 + range);
- pre-flight with `HEAD` to read size/type;
- keep per-song `<audio>` state; the storage abstraction is ready for object-
  store backends without endpoint changes.
