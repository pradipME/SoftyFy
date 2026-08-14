# SoftyFy

A mobile-first, Spotify-style web player for your **own personal music collection** — with no login, no backend, and no database. Everything is a static website: your songs and covers are shipped as files inside the app and played directly in the browser.

> **No server. No accounts. No ads.** Just your music.

## Tech Stack

- **React + TypeScript + Vite** for the app
- **Tailwind CSS v4** for styling (Spotify-inspired dark theme)
- **react-router-dom** for the three pages (Home / Search / Library)
- A single shared `<audio>` element managed by a React Context so playback keeps going as you navigate

All commands below run from the `frontend/` directory (that is the project root).

## Features

- Home page with a time-based greeting and a grid of your songs
- Instant client-side Search across title, artist and album
- Library page with sortable, full list of songs
- Persistent mini player pinned at the bottom (above the bottom nav on mobile)
- Full-screen **Now Playing** sheet — tap the mini player to open it; swipe down, tap the chevron, or press `Esc` to close it
- Play / pause / previous / next, seekable progress bar, volume, shuffle and repeat
- Auto-advances to the next song when a track ends
- Keyboard shortcuts: `Space` play/pause, `←`/`→` seek ±5s, `M` mute
- Volume, mute, shuffle and repeat preferences are remembered between visits
- Fully offline once the songs are in place (no network calls for playback)

## Project Structure

```
frontend/
├── public/
│   ├── audio/        ← drop your music files here (mp3, m4a, ogg, wav, …)
│   ├── covers/       ← drop square cover images here
│   └── favicon.svg
└── src/
    ├── data/songs.ts            ← THE catalog — add/edit your songs here
    ├── types/song.ts            ← the Song type
    ├── context/PlayerContext.tsx← global player state + shared <audio>
    ├── hooks/useAudioPlayer.ts  ← wraps the HTMLAudioElement
    ├── components/
    │   ├── layout/    Sidebar (desktop), BottomNav (mobile), AppShell
    │   ├── player/    PlayerBar, NowPlayingSheet, ProgressBar, VolumeControl
    │   ├── song/      SongCard, SongGrid, SongRow, SongList, Cover
    │   └── ui/        Button, IconButton, Skeleton, icons
    └── pages/         Home, Search, Library
```

## Getting Started

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Production build and preview:

```powershell
npm run build      # outputs to frontend/dist
npm run preview    # serve the built site locally
```

Other scripts: `npm run lint` (oxlint) and `npm test` (vitest, reducer unit tests).

## Adding Your Songs

1. **Audio** — copy each music file into `frontend/public/audio/`. MP3 and M4A are safest; OGG/WAV work in most browsers.
2. **Covers (optional)** — copy a square image per song into `frontend/public/covers/`. Missing or broken images automatically fall back to a gradient placeholder.
3. **Catalog** — open `src/data/songs.ts`. It is heavily commented and the only file you normally need to touch. Each entry looks like:

   ```ts
   {
     id: 'track-01',              // unique, letters/numbers/dashes
     title: 'Track 01',           // shown in the UI
     artist: 'Unknown Artist',    // shown under the title
     album: 'Local Collection',   // optional — used by Search
     durationSec: 187,            // rough length; real duration is read automatically
     audioSrc: '/audio/track-01.mp3',
     coverSrc: '/covers/track-01.svg',
   }
   ```

   Update the existing 24 placeholder entries with your real titles, artists, file names and cover paths — or add/remove entries freely. The order in this file is the order shown on the Home and Library pages.

4. Save, reload the page, and play.

## Deployment

The build is a pure static site — deploy `frontend/dist` to **any** static host: Vercel, Netlify, GitHub Pages, Render Static Site, Cloudflare Pages, or a plain web server.

- No server, database, or environment variables are required.
- The app uses hash-based routing, so no SPA redirect/rewrite rule is needed.
- To serve under a sub-path (e.g. GitHub Pages project page), set the Vite `base` option in `vite.config.ts`.

### Install as a Progressive Web App

SoftyFy is a PWA: on Android Chrome (or iOS Safari) open the deployed URL, tap the browser menu and choose **Add to Home screen / Install app**. It opens in standalone (no browser UI) with `#121212` theming and a home-screen icon.

- The manifest (`manifest.webmanifest`), service worker (`sw.js`) and icons live in `dist/`, so any static host — including the Render deployment — serves them with no extra config.
- Only the app shell (~0.4 MB) is precached. Covers are cached the first time you see them and songs are cached the first time you play them, so the ~225 MB music library never blocks installation and works offline after being played once.
- To regenerate the launcher icons from `public/favicon.svg` after changing the logo: `npm run icons`.

## License / Content

Intended for personal use with music you own or are licensed to play. Do not distribute content you do not have the rights to.
