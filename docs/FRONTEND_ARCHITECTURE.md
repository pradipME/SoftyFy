# Frontend Architecture

> Design spec only. No frontend code is implemented for the domain yet; the
> frontend is the Phase 1 Vite + React + TypeScript + Tailwind skeleton.

## Stack

- Vite 8 + React 19 + TypeScript 6 (`frontend/`, build = `tsc -b && vite build`)
- Tailwind CSS v4 (Vite plugin), `oxlint` for linting
- Styling: Tailwind utility classes; design tokens via Tailwind theme

## Directory layout (planned)

```
frontend/src
├── api/            # typed API client + request helpers (fetch wrapper)
├── hooks/          # React hooks (usePlayer, useFavorites, ...)
├── types/          # TS types mirroring backend DTOs
├── state/          # UI state (PlayerContext, query caches)
├── pages/          # route-level views
├── components/     # reusable components
└── player/         # <audio> element wrapper + queue logic
```

## Data flow

- The API client talks to `VITE_API_BASE_URL` (see `frontend/.env.example`),
  pointing at the backend `/api`.
- Backend `PageResponse<T>` envelopes and RFC 7807 `ProblemDetail` errors are
  mapped to typed helpers (e.g. a `parseProblem(response)` that returns
  `{ code, status, detail, errors }`).
- DTO records on the backend (`SongDto`, `SongSummaryDto`, `PlaylistDetailDto`,
  `FavoriteDto`, `AudioFileDto`, ...) are mirrored 1:1 in `types/`.

## Planned pages

- Browse: songs / artists / albums lists (pagination, song sort)
- Artist & album detail views
- Playlist views: list, detail, create, add/remove songs, reorder
- Favorites view
- Player bar (global `<audio>` element, queue, seek/volume)

## Phase notes

- Phase 2 delivered backend + docs only. The frontend pages, API client, player
  state, routing, and player UI are scheduled for a later phase and should
  consume the documented `/api` contract (see `API_ARCHITECTURE.md`).
