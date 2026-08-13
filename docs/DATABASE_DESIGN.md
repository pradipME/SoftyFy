# Database Design

- Database: PostgreSQL 16 (see `docker-compose.yml`).
- **Flyway owns the schema.** JPA runs with `ddl-auto: none`; all DDL lives in
  `backend/src/main/resources/db/migration/`. Flyway is configured out of the box
  by Spring Boot (the PostgreSQL module is required for Flyway 11 and is declared
  in `pom.xml`).

## Schema

See `V1__initial_schema.sql` for the authoritative DDL. Summary:

### Tables

| Table | Columns (key) | Notes |
| --- | --- | --- |
| `artist` | `id` PK, `name` (not null) | |
| `album` | `id` PK, `title` (not null), `year`, `artist_id` FK | |
| `song` | `id` PK, `title` (not null), `duration_seconds`, `track_number`, `album_id` FK | |
| `song_artist` | `(song_id, artist_id)` PK, FKs | join table |
| `audio_file` | `id` PK, `song_id` FK (not null), `storage_provider`, `storage_key`, `format`, `bitrate_kbps`, `size_bytes`, `is_primary` | see constraints below |
| `playlist` | `id` PK, `name` (not null), `description` | |
| `playlist_song` | `(playlist_id, song_id)` PK, `position` (not null), FKs | see constraints below |
| `favorite` | `song_id` PK, FK | no surrogate id |

All tables carry `created_at`/`updated_at` `timestamptz` columns populated by JPA auditing.

### Constraints of note

- `audio_file`: `UNIQUE (storage_provider, storage_key)` — a stored object maps to one row.
- `audio_file`: **partial unique index** `uq_audio_file_primary_per_song` on
  `(song_id) WHERE is_primary` — a song may have many files, but at most one
  primary. There is **no** unique constraint on `song_id` alone.
- `playlist_song`: `UNIQUE (playlist_id, position)` declared
  **`DEFERRABLE INITIALLY DEFERRED`** — a database backstop that lets a reorder
  transaction temporarily hold duplicate positions inside a single statement
  without blocking the atomic swap.
- `playlist_song`: PK `(playlist_id, song_id)` — a song can appear at most once
  in a playlist (duplicates disallowed by design).

### Indexes

- GIN trigram indexes (`lower(...)` + `pg_trgm`) on `artist.name`, `album.title`,
  `song.title` — prepared for free-text search in a later phase.
- B-tree indexes on every FK column for join performance.

## Reorder strategy

`PUT /api/playlists/{id}/songs/order` performs a reorder in a single transaction:

1. Load the playlist's current `(song_id)` list.
2. Validate the request is an **exact permutation** of the current songs:
   - same size (missing/extra ids rejected),
   - no duplicates in the request.
3. Execute **one atomic SQL `UPDATE`** with a `CASE` expression assigning final
   positions 0-based:

   ```sql
   update playlist_song
   set position = case song_id when ? then 0 when ? then 1 ... end
   where playlist_id = ?
   ```

   Because it is a single statement, PostgreSQL checks the
   `(playlist_id, position)` uniqueness constraint only once, at statement end,
   so the swap never exposes or blocks on an intermediate duplicate position.
4. `Deferred` constraint handling is the backstop for any other write path.

`addSongs` appends new songs at `max position + 1`; `removeSong` reindexes the
remaining entries.

## Verification status

The Flyway migration has **not been executed** in this environment: there is no
local PostgreSQL/Docker. The migration is written to match the JPA entity
column names (`@Column`/`@JoinColumn`) exactly, but the run was **NOT VERIFIED**.
