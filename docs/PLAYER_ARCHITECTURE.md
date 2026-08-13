# Full Music Player & Playback Experience

Phase 6 replaces the Phase 5 "test play" proof with a real, global player: a
single `HTMLAudioElement` owned by one React context provider, with a queue,
shuffle/repeat, seeking, volume, keyboard shortcuts, Media Session support, a
bottom player bar, a mobile compact player with an expanded `/now-playing`
route, and a queue drawer. Playback consumes the existing streaming endpoint
(`GET /api/songs/{id}/stream`, HTTP Range) — the backend protocol is unchanged.

```
PlayQueueButton / PlayerBar / NowPlaying / QueueList
        │
        ▼
AudioPlayerProvider (src/state/PlayerContext.tsx)
        │  useReducer  │  ONE <audio> (useRef)
        ▼              ▼
player/reducer.ts    streamUrl(songId) ──► GET /api/songs/{id}/stream
```

## 1. State architecture

- React Context + `useReducer`. No Redux/Zustand.
- `src/player/types.ts` — `PlayerState`, `QueueItem`, `PlayIntent`, `RepeatMode`
  (`'off' | 'all' | 'one'`, type-safe union, no magic strings), `PlaybackStatus`.
- `src/player/reducer.ts` — the reducer and `createInitialState(preferences)`.
- Two contexts to keep re-renders bounded:
  - `StateContext` — the full state (currentTime changes every ~250 ms, so only
    the bar / now-playing / queue consume it).
  - `ApiContext` — a `useMemo`-stabilized `PlayerApi` (currentSong, status,
    `playSong`, `play`, `pause`, `togglePlay`, `next`, `previous`, `playAt`,
    `addToQueue`, `removeFromQueue`, `clearQueue`, `reorderQueue`, `seek`,
    `seekBy`, `setVolume`, `toggleMute`, `cycleRepeat`, `setRepeatMode`,
    `toggleShuffle`). List rows consume only this, so `timeupdate` does not
    re-render song tables.

## 2. Queue model

- `queue` — the original list of `QueueItem`s (backend ordering for albums,
  playlists, favorites, and the song list).
- `playOrder` — a derived permutation of indices into `queue` (identity when
  shuffle is off).
- `position` — the current index into `playOrder`.

Pure functions in `src/player/logic.ts`:

- `buildPlayOrder(length, startIndex, shuffleEnabled)` — non-shuffled: identity
  order, position = startIndex. Shuffled: the start song stays first (never an
  immediate duplicate), the rest is Fisher–Yates-shuffled (`Math.random`).
- `enableShuffle(playOrder, position)` — keep the current song first, shuffle
  the rest, position 0.
- `nextPosition(state)` — repeat `'one'` stays put, repeat `'all'` wraps, `'off'`
  stops at the end (returns `null`).
- `previousTarget(state, currentTime)` — > 3 s restarts the current song;
  otherwise steps back, restarting at the start of the queue.

Queue mutations (`ADD_TO_QUEUE`, `REMOVE_FROM_QUEUE`, `REORDER_QUEUE`,
`CLEAR_QUEUE`) remap `playOrder` and keep the current song continuous; they
never trigger playback on their own.

## 3. One-shot play intent (autoplay contract)

Playback is driven by a single authoritative effect and a one-shot intent:

```
PlayIntent { startAt: number | null }
```

- `PLAY_SONG`, `PLAY`, `PLAY_AT`, `NEXT`, `PREVIOUS` set `playIntent`
  (`startAt: 0` for restart/replay transitions, `null` otherwise).
- Queue mutations, `PAUSE`, and `PLAY_FAILED` clear it.
- The song-load effect runs only when
  `[queue, playOrder, position, playIntent]` change:
  - It sets `audio.src` + `audio.load()` **only** when
    `loadedSongIdRef.current !== song.id`.
  - It calls `audio.play()` **at most once** per transition, restoring
    `audio.currentTime` only when `intent.startAt != null` (never from stale
    state), then dispatches `CONSUME_PLAY_INTENT`.
- `audio.play()` rejection: an `AbortError` while the element is paused is
  treated as an interruption (dispatch `PAUSE`); anything else becomes
  `PLAY_FAILED` (`status: 'error'`, `error: 'Unable to play this song.'`).
- Retry: `play()` resets `loadedSongIdRef` when `audio.error` is set, forcing a
  fresh load on the next pass.
- `currentSong === null` pauses the element, removes `src`, and resets
  `loadedSongIdRef`, so clearing the queue stops playback.

## 4. The single audio element

- `AudioPlayerProvider` owns `audioRef` (`useRef<HTMLAudioElement | null>`).
- A mount effect creates `new Audio()` (preload `'metadata'`) only when the ref
  is still null, attaches all listeners once, and removes them on cleanup —
  without nulling the ref. StrictMode double-mounts therefore reuse the same
  element and never register duplicate listeners (covered by tests).
- Exactly one element exists for the whole app; there is no module-level
  singleton and no per-row audio element.

Events handled (13): `timeupdate` (throttled to every 250 ms via
`performance.now`), `seeked`, `loadedmetadata`, `durationchange`, `play`,
`playing`, `pause`, `waiting`, `stalled`, `loadstart`, `emptied`, `error`,
`ended`. The `ended` handler dispatches a single `NEXT` — no duplicate advances.

## 5. Persistence

`src/player/persistence.ts` stores `{ volume, isMuted, repeatMode,
shuffleEnabled }` in `localStorage` under `softyfy:player`. Reads go through
`sanitizePreferences` (clamps values, rejects unknown repeat modes); writes are
guarded so a full/blocked `localStorage` never breaks playback. The reducer
initializes from `loadPreferences(safeStorage())`.

## 6. UI

- `components/player/PlayerBar.tsx` — desktop: artwork/title/artists (left),
  shuffle/previous/play/next/repeat + seek bar with timestamps (center), queue
  button with count badge + mute + volume (right). Mobile: compact bar with a
  slim seek bar and artwork that links to `/now-playing`.
- `pages/NowPlayingPage.tsx` — expanded route: large artwork, full controls,
  seek + volume, and an inline "Up next" queue. The global bar is hidden on
  `/now-playing` (see `AppShell`).
- `components/player/QueueDrawer.tsx` + `QueueList.tsx` — right slide-over
  (Escape to close, overlay) with play-on-click, reorder up/down, remove,
  clear, and current-song highlighting; `QueueList` is shared with Now Playing.
- `components/player/PlayQueueButton.tsx` — per-row play/pause/loading; resumes
  the current song, otherwise starts the row's list at that row.
- Wiring: `SongList`/`SongSummaryList` rows (songs, album, artist, favorites),
  `PlaylistDetailPage` (a header "Play" button plays the playlist in backend
  order; each row plays from its position), current rows highlighted.
- Artwork is always the `AlbumArt` placeholder (initials + gradient); no fake
  artwork URLs. Branding is SoftyFy's own — no third-party branding.

## 7. Keyboard shortcuts

`Space` play/pause, `←`/`→` seek ±5 s, `↑`/`↓` volume ±0.1, `M` mute. The
handler ignores `input`, `textarea`, `select`, `button`, `a`, and
contenteditable targets so form and control behavior is never hijacked.

## 8. Media Session API

Handlers (`play`, `pause`, `previoustrack`, `nexttrack`) are registered once
with stable callbacks and metadata (`title`, `artist`, `album`, empty artwork)
plus `playbackState` update on song/status change. Everything degrades
gracefully when `navigator.mediaSession` is unavailable.

## 9. Time formatting

`src/player/format.ts` — `formatPlaybackTime` renders `0:00`, `1:05`, `12:34`,
`1:02:45`; NaN/Infinity/negative collapse to `0:00`. Durations are sanitized in
the reducer (`SET_DURATION`/`SET_CURRENT_TIME` reject non-finite values), so
`NaN:NaN` never appears.

## 10. Testing

- Pure logic (`src/player/*.test.ts`): `logic` (buildPlayOrder, enableShuffle,
  nextPosition incl. repeat off/all/one, previousTarget incl. the 3 s
  threshold, shuffle), `reducer` (playSong, play/pause, next, previous, repeat
  modes, shuffle on/off, queue add/remove/reorder/clear, seek, volume, mute,
  ended, play failure, empty/single-song queues, intent lifecycle), `format`,
  and `persistence` (sanitize/load/save, corrupt data, unavailable storage).
- Provider integration (`src/state/PlayerContext.test.tsx`, jsdom +
  `@testing-library/react`): a `MockAudioElement` stub replaces `window.Audio`;
  asserts exactly one element under StrictMode, no autoplay on mount, one
  `play()` per transition, stream URLs, switching/resuming songs, queue
  mutations never autoplay, clearing pauses, play rejection -> `error`, and
  single-advance `ended`.
- Commands: `npm run test`, `npm run lint`, `npm run build`; backend
  `.\mvnw.cmd clean package` stays green (no backend changes in this phase).

## 11. Out of scope

Authentication/accounts, payments, ads, third-party catalogs, AI
recommendations, transcoding, external object storage, waveform/visualizer/
lyrics/podcasts, and any change to the streaming protocol. Backend DB
migrations are untouched.
