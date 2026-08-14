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
    coverSrc: '/covers/afsos.jpg',
  },
  {
    id: 'arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Coke Studio Bharat', // filename indicates the show; TODO: user may want the actual singer's name instead
    album: 'Coke Studio Bharat',
    durationSec: 0,
    audioSrc: '/audio/Arz Kiya Hai _ Coke Studio Bharat (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/arz-kiya-hai.jpg',
  },
  {
    id: 'gul',
    title: 'Gul',
    artist: 'Unknown Artist', // TODO: user will correct this later
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Gul (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/gul.jpg',
  },
  {
    id: 'inaam-anuv-jain',
    title: 'Inaam',
    artist: 'Anuv Jain',
    album: 'Inaam',
    durationSec: 0, // TODO: update once known, or let the player read real duration from the audio file at runtime if that's already supported
    audioSrc: '/audio/Inaam Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/inaam-anuv-jain.jpg', // placeholder cover, replace later with real album art if desired
  },
  {
    id: 'afsanay',
    title: 'Afsanay',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Afsanay (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/afsanay.jpg',
  },
  {
    id: 'tera-mera-hai-pyar',
    title: 'Tera Mera Hai Pyar',
    artist: 'Ahmed Jahanzeb',
    album: 'Ishq Murshid',
    durationSec: 0,
    audioSrc: '/audio/Ahmed_Jahanzeb_-_Tera_Mera_Hai_Pyar_From_Ishq_Murshid_(mp3.pm).mp3',
    coverSrc: '/covers/tera-mera-hai-pyar.jpg',
  },
  {
    id: 'if-we-have-each-other',
    title: 'If We Have Each Other',
    artist: 'Alec Benjamin',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Alec_Benjamin_-_If_We_Have_Each_Other_(mp3.pm).mp3',
    coverSrc: '/covers/if-we-have-each-other.jpg',
  },
  {
    id: 'bairan',
    title: 'Bairan',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Bairan - Bairan (320 kbps).mp3',
    coverSrc: '/covers/bairan.jpg',
  },
  {
    id: 'barsaat-banjaare',
    title: 'Barsaat Banjaare',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Barsaat Banjaare 320 Kbps.mp3',
    coverSrc: '/covers/Barsaat Banjaare.jpg',
  },
  {
    id: 'departure-lane',
    title: 'Departure Lane',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Departure Lane (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/departure-lane.jpg',
  },
  {
    id: 'downers-at-dusk',
    title: 'Downers At Dusk',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Downers At Dusk (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/downers-at-dusk.jpg',
  },
  {
    id: 'him-and-i',
    title: 'Him & I',
    artist: 'G-Eazy feat. Halsey',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/G-Easy_feat._Halsey_-_Him_And_I_(mp3.pm).mp3',
    coverSrc: '/covers/him-and-i.jpg',
  },
  {
    id: 'glass-half-full',
    title: 'Glass Half Full',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Glass Half Full (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/glass-half-full.jpg',
  },
  {
    id: 'husn',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Husn Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/husn.jpg',
  },
  {
    id: 'janam-janam',
    title: 'Janam Janam',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: 'Dilwale',
    durationSec: 0,
    audioSrc: '/audio/Janam Janam Dilwale 320 Kbps.mp3',
    coverSrc: '/covers/janam-janam.jpg',
  },
  {
    id: 'jo-tum-mere-ho',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Jo Tum Mere Ho Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/jo-tum-mere-ho.jpg',
  },
  {
    id: 'long-time-no-see',
    title: 'Long Time No See',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Long Time No See (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/long-time-no-see.jpg',
  },
  {
    id: 'main-yahaan-hoon',
    title: 'Main Yahaan Hoon',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: 'Veer-Zaara',
    durationSec: 0,
    audioSrc: '/audio/Main Yahaan Hoon Veer Zaara 320 Kbps.mp3',
    coverSrc: '/covers/main-yahaan-hoon.jpg',
  },
  {
    id: 'such-keh-raha-hai-rehnaa-hai-terre-dil-mein',
    title: 'Such Keh Raha Hai / Rehnaa Hai Terre Dil Mein',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Such Keh Raha Hai Rehnaa Hai Terre Dil Mein 320 Kbps.mp3',
    coverSrc: '/covers/such-keh-raha-hai-rehnaa-hai-terre-dil-mein.jpg',
  },
  {
    id: 'gumaan',
    title: 'Gumaan',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Talha_Anjum_Talhah_Yunus_Young_Stunners_-_Gumaan_(mp3.pm).mp3',
    coverSrc: '/covers/gumaan.jpg',
  },
  {
    id: 'tera-mera-rishta',
    title: 'Tera Mera Rishta',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Tera Mera Rishta (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/tera-mera-rishta.jpg',
  },
  {
    id: 'teri-yaad',
    title: 'Teri Yaad',
    artist: 'Unknown Artist', // TODO: placeholder, verify/correct manually
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Teri Yaad (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/teri-yaad.jpg',
  },
  {
    id: 'no-one-noticed',
    title: 'No One Noticed (Extended)',
    artist: 'The Marias',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/The_Mar_as_-_No_One_Noticed_Extended_English_(mp3.pm).mp3',
    coverSrc: '/covers/no-one-noticed.jpg',
  },
  {
    id: 'those-eyes',
    title: 'Those Eyes',
    artist: 'New West',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Those_Eyes_-_New_West_(mp3.pm).mp3',
    coverSrc: '/covers/those-eyes.jpg',
  },
]

/** Quick lookup by id (used by the player to restore a saved queue). */
export const SONGS_BY_ID: Record<string, Song> = Object.fromEntries(
  SONGS.map((song) => [song.id, song]),
)
