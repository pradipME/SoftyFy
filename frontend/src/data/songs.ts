import type { Song } from '../types/song'

// ===========================================================================
// YOUR SONGS LIVE HERE
// ---------------------------------------------------------------------------
// This is the ONLY file you normally need to edit. To add a song:
//
//   1. Copy your audio file into  public/audio/   (any format the browser can
//      play: .mp3, .m4a, .ogg, .wav, .flac — mp3/m4a are safest).
//   2. (Optional) Copy a square cover image into  public/covers/  (.jpg, .png,
//      .svg, .webp). If you skip this the placeholder cover is used.
//   3. Add a new entry below with:
//        id         any short unique text (letters, numbers, dashes)
//        title      the song title
//        artist     the artist name
//        durationSec rough length in seconds — the real duration is read from
//                    the audio file automatically, so this is just a fallback
//        audioSrc   "/audio/YOUR-FILE.mp3"          (the file from step 1)
//        coverSrc   "/covers/YOUR-COVER.jpg"        (the file from step 2)
//
// Order matters — it's the order shown in Home and Library. Adding or removing
// entries will not break anything else.
// ===========================================================================

export const SONGS: Song[] = [
  {
    id: 'afsos',
    title: 'Afsos',
    artist: 'Unknown Artist', // TODO: user will correct this later
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Afsos (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/track-02.svg',
  },
  {
    id: 'arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Coke Studio Bharat', // filename indicates the show; TODO: user may want the actual singer's name instead
    album: 'Coke Studio Bharat',
    durationSec: 0,
    audioSrc: '/audio/Arz Kiya Hai _ Coke Studio Bharat (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/track-03.svg',
  },
  {
    id: 'gul',
    title: 'Gul',
    artist: 'Unknown Artist', // TODO: user will correct this later
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Gul (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/track-04.svg',
  },
  {
    id: 'inaam-anuv-jain',
    title: 'Inaam',
    artist: 'Anuv Jain',
    album: 'Inaam',
    durationSec: 0, // TODO: update once known, or let the player read real duration from the audio file at runtime if that's already supported
    audioSrc: '/audio/Inaam Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/track-01.svg', // placeholder cover, replace later with real album art if desired
  },
]

/** Quick lookup by id (used by the player to restore a saved queue). */
export const SONGS_BY_ID: Record<string, Song> = Object.fromEntries(
  SONGS.map((song) => [song.id, song]),
)
