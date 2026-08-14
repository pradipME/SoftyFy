Drop your music files in this folder.

SoftyFy plays whatever the browser can decode — MP3 and M4A/AAC are the safest
choices. The placeholder catalog in `src/data/songs.ts` expects files named
`track-01.mp3` through `track-24.mp3`.

To add a song:

1. Copy your audio file here (e.g. `track-01.mp3`).
2. Open `src/data/songs.ts` and update the matching entry (or add a new one)
   so `audioSrc` points at your file, e.g. `/audio/track-01.mp3`.
3. Run `npm run dev` and hit play.

See the README at the repository root for the full guide.
