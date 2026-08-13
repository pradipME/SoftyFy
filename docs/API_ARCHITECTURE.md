# API Architecture

REST API served by the Spring Boot backend at `/api`. All responses are JSON.

## Conventions

- **Pagination**: list endpoints accept `page` (0-based) and `size` (max 100,
  clamped) and return a `PageResponse<T>` envelope:

  ```json
  {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 42,
    "totalPages": 3,
    "first": true,
    "last": false
  }
  ```

- **Errors**: RFC 7807 `ProblemDetail` produced by `GlobalExceptionHandler`:

  ```json
  {
    "type": "about:blank",
    "title": "SONG_NOT_FOUND",
    "status": 404,
    "detail": "Song not found: <id>",
    "code": "SONG_NOT_FOUND",
    "errors": { "title": "title is required" }
  }
  ```

  The `code` property carries a machine-readable `ErrorCode`:

  | Code | HTTP | Meaning |
  | --- | --- | --- |
  | `SONG_NOT_FOUND` / `ARTIST_NOT_FOUND` / `ALBUM_NOT_FOUND` / `PLAYLIST_NOT_FOUND` / `AUDIO_NOT_FOUND` | 404 | Entity missing |
  | `INVALID_REORDER_REQUEST` | 400 | Reorder body is not an exact permutation |
  | `VALIDATION_FAILED` | 400 | Bean validation or malformed input; `errors` maps field → message |
  | `INVALID_SORT` | 400 | Unknown `sort` value |
  | `INVALID_FILE` | 400 | Unsupported extension, wrong magic bytes, or MIME mismatch |
  | `UNSUPPORTED_MEDIA_TYPE` | 415 | Missing multipart part or unsupported content type |
  | `FILE_TOO_LARGE` | 413 | Upload exceeds the configured size limit |
  | `STORAGE_ERROR` | 500 | Underlying storage write/delete failure |
  | `INVALID_RANGE` | 416 | Unsatisfiable byte range (media response, no JSON body) |
  | `CONFLICT` | 409 | Data integrity violation |
  | `INTERNAL_ERROR` | 500 | Unhandled exception (logged, detail hidden) |

- **Validation**: Jakarta Bean Validation on request DTOs (e.g. `@NotBlank`,
  `@Size`, `@NotEmpty`, `@NotNull`).
- **Sorting**: `GET /api/songs` supports `sort=title|artist|album|created`
  (default `title`). Other list endpoints have fixed sort orders.

## Endpoints (implemented)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/songs?page&size&sort` | Paginated songs |
| GET | `/api/songs/{id}` | Song detail (includes `audioFiles`) |
| POST | `/api/songs` | Create song; `artistNames` are resolved-or-created, optional `albumId` must exist |
| GET | `/api/artists?page&size` | Paginated artists |
| GET | `/api/artists/{id}` | Artist detail with albums |
| GET | `/api/albums?page&size` | Paginated albums |
| GET | `/api/albums/{id}` | Album detail with songs |
| GET | `/api/playlists?page&size` | Paginated playlists |
| POST | `/api/playlists` | Create playlist |
| GET | `/api/playlists/{id}` | Playlist detail, songs in position order |
| POST | `/api/playlists/{id}/songs` | Add songs (skips duplicates, validates all ids) |
| DELETE | `/api/playlists/{id}/songs/{songId}` | Remove song (reindexes; idempotent) |
| PUT | `/api/playlists/{id}/songs/order` | Reorder (exact permutation, atomic) |
| GET | `/api/favorites?page&size` | Paginated favorites, newest first |
| POST | `/api/favorites` | Favorite a song (body `{"songId": "..."}`; idempotent) |
| POST | `/api/favorites/{songId}` | Favorite a song by path (idempotent) |
| DELETE | `/api/favorites/{songId}` | Remove favorite (idempotent, 204) |
| POST | `/api/songs/upload` | Upload an audio file (multipart `file`, optional `title`/`artist`/`album` overrides); 201 = new song, 200 = already imported. Body: `{"song": {...}, "created": bool}` |
| GET | `/api/songs/{id}/stream` | Stream audio with HTTP Range support: 200 full, 206 partial, 416 unsatisfiable |
| HEAD | `/api/songs/{id}/stream` | Headers only (size, type, `Accept-Ranges: bytes`), no body |
| DELETE | `/api/songs/{id}` | Delete a song and its stored audio objects (204) |

Streaming behavior is documented in `docs/AUDIO_STREAMING.md`.

### Create song example

```json
{
  "title": "Bohemian Rhapsody",
  "durationSeconds": 354,
  "trackNumber": 11,
  "albumId": "01950000-0000-7000-8000-000000000000",
  "artistNames": ["Queen"]
}
```

## Not implemented (later phases)

- `PATCH /api/songs`, `PATCH`/`DELETE /api/playlists`
  (request DTOs exist).
- Free-text query params and `/api/search`.
- Upload / object storage providers beyond local disk (`AudioStorage` is the
  boundary interface; streaming already reads through it via
  `info` / `openStream`).
