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
//        library    album name shown on Home (e.g. "Bathroom", "Qwali")
//
// Order matters — it's the order shown in Home and Library. Adding or removing
// entries will not break anything else.
// ===========================================================================

export const SONGS: Song[] = [
  // ── Bathroom ─────────────────────────────────────────────────────────────
  {
    id: 'afsos',
    title: 'Afsos',
    artist: 'Anuv Jain, AP Dhillon',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Afsos (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/afsos.jpg',
    library: 'Bathroom',
  },
  {
    id: 'arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Coke Studio Bharat',
    durationSec: 0,
    audioSrc: '/audio/Arz Kiya Hai _ Coke Studio Bharat (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/arz-kiya-hai.jpg',
    library: 'Bathroom',
  },
  {
    id: 'gul',
    title: 'Gul',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Gul (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/gul.jpg',
    library: 'Bathroom',
  },
  {
    id: 'inaam-anuv-jain',
    title: 'Inaam',
    artist: 'Anuv Jain',
    album: 'Inaam',
    durationSec: 0,
    audioSrc: '/audio/Inaam Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/inaam-anuv-jain.jpg',
    library: 'Bathroom',
  },
  {
    id: 'afsanay',
    title: 'Afsanay',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Afsanay (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/afsanay.jpg',
    library: 'Bathroom',
  },
  {
    id: 'tera-mera-hai-pyar',
    title: 'Tera Mera Hai Pyar',
    artist: 'Ahmed Jahanzeb',
    album: 'Ishq Murshid',
    durationSec: 0,
    audioSrc: '/audio/Ahmed_Jahanzeb_-_Tera_Mera_Hai_Pyar_From_Ishq_Murshid_(mp3.pm).mp3',
    coverSrc: '/covers/tera-mera-hai-pyar.jpg',
    library: 'Bathroom',
  },
  {
    id: 'if-we-have-each-other',
    title: 'If We Have Each Other',
    artist: 'Alec Benjamin',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Alec_Benjamin_-_If_We_Have_Each_Other_(mp3.pm).mp3',
    coverSrc: '/covers/if-we-have-each-other.jpg',
    library: 'Bathroom',
  },
  {
    id: 'bairan',
    title: 'Bairan',
    artist: 'Banjaare',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Bairan - Bairan (320 kbps).mp3',
    coverSrc: '/covers/bairan.jpg',
    library: 'Bathroom',
  },
  {
    id: 'barsaat-banjaare',
    title: 'Barsaat Banjaare',
    artist: 'Banjaare',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Barsaat Banjaare 320 Kbps.mp3',
    coverSrc: '/covers/Barsaat Banjaare.jpg',
    library: 'Bathroom',
  },
  {
    id: 'departure-lane',
    title: 'Departure Lane',
    artist: 'Talha Anjum, Umair',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Departure Lane (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/departure-lane.jpg',
    library: 'Bathroom',
  },
  {
    id: 'downers-at-dusk',
    title: 'Downers At Dusk',
    artist: 'Talha Anjum, Umair',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Downers At Dusk (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/downers-at-dusk.jpg',
    library: 'Bathroom',
  },
  {
    id: 'him-and-i',
    title: 'Him & I',
    artist: 'G-Eazy feat. Halsey',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/G-Easy_feat._Halsey_-_Him_And_I_(mp3.pm).mp3',
    coverSrc: '/covers/him-and-i.jpg',
    library: 'Bathroom',
  },
  {
    id: 'glass-half-full',
    title: 'Glass Half Full',
    artist: 'Talha Anjum, JJ47, Talhah Yunus',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Glass Half Full (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/glass-half-full.jpg',
    library: 'Bathroom',
  },
  {
    id: 'husn',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Husn Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/husn.jpg',
    library: 'Bathroom',
  },
  {
    id: 'janam-janam',
    title: 'Janam Janam',
    artist: 'Arijit Singh, Antara Mitra',
    album: 'Dilwale',
    durationSec: 0,
    audioSrc: '/audio/Janam Janam Dilwale 320 Kbps.mp3',
    coverSrc: '/covers/janam-janam.jpg',
    library: 'Bathroom',
  },
  {
    id: 'jo-tum-mere-ho',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Jo Tum Mere Ho Anuv Jain 320 Kbps.mp3',
    coverSrc: '/covers/jo-tum-mere-ho.jpg',
    library: 'Bathroom',
  },
  {
    id: 'long-time-no-see',
    title: 'Long Time No See',
    artist: 'Taimour Baig, AUR',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Long Time No See (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/long-time-no-see.jpg',
    library: 'Bathroom',
  },
  {
    id: 'main-yahaan-hoon',
    title: 'Main Yahaan Hoon',
    artist: 'Udit Narayan',
    album: 'Veer-Zaara',
    durationSec: 0,
    audioSrc: '/audio/Main Yahaan Hoon Veer Zaara 320 Kbps.mp3',
    coverSrc: '/covers/main-yahaan-hoon.jpg',
    library: 'Bathroom',
  },
  {
    id: 'such-keh-raha-hai-rehnaa-hai-terre-dil-mein',
    title: 'Such Keh Raha Hai / Rehnaa Hai Terre Dil Mein',
    artist: 'Kumar Sanu, Alka Yagnik',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Such Keh Raha Hai Rehnaa Hai Terre Dil Mein 320 Kbps.mp3',
    coverSrc: '/covers/such-keh-raha-hai-rehnaa-hai-terre-dil-mein.jpg',
    library: 'Bathroom',
  },
  {
    id: 'gumaan',
    title: 'Gumaan',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Talha_Anjum_Talhah_Yunus_Young_Stunners_-_Gumaan_(mp3.pm).mp3',
    coverSrc: '/covers/gumaan.jpg',
    library: 'Bathroom',
  },
  {
    id: 'tera-mera-rishta',
    title: 'Tera Mera Rishta',
    artist: 'Mustafa Zahid',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Tera Mera Rishta (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/tera-mera-rishta.jpg',
    library: 'Bathroom',
  },
  {
    id: 'teri-yaad',
    title: 'Teri Yaad',
    artist: 'Unknown Artist',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Teri Yaad (PenduJatt.Com.Se).mp3',
    coverSrc: '/covers/teri-yaad.jpg',
    library: 'Bathroom',
  },
  {
    id: 'no-one-noticed',
    title: 'No One Noticed (Extended)',
    artist: 'The Marias',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/The_Mar_as_-_No_One_Noticed_Extended_English_(mp3.pm).mp3',
    coverSrc: '/covers/no-one-noticed.jpg',
    library: 'Bathroom',
  },
  {
    id: 'those-eyes',
    title: 'Those Eyes',
    artist: 'New West',
    album: '',
    durationSec: 0,
    audioSrc: '/audio/Those_Eyes_-_New_West_(mp3.pm).mp3',
    coverSrc: '/covers/those-eyes.jpg',
    library: 'Bathroom',
  },
  // ── Qwali ────────────────────────────────────────────────────────────────
  {
    id: 'tumhe-dillagi',
    title: 'Tumhe Dillagi Bhool Jani Padegi',
    artist: 'Nusrat Fateh Ali Khan, Purnam Allahabadi',
    album: '',
    durationSec: 983,
    audioSrc: '/audio/Tumhe Dillagi Bhool Jani Padegi.mp3',
    coverSrc: '/covers/tumhe-dillagi.jpg',
    library: 'Qwali',
  },
  {
    id: 'main-teri-bahon',
    title: 'Main Teri Bahon Ke Jhule Me Pali Babul',
    artist: 'Lata Mangeshkar, Udit Narayan',
    album: '',
    durationSec: 437,
    audioSrc: '/audio/Main Teri Bahon Ke Jhule Me Pali Babul.mp3',
    coverSrc: '/covers/main-teri-bahon.jpg',
    library: 'Qwali',
  },
]

/** Quick lookup by id (used by the player to restore a saved queue). */
export const SONGS_BY_ID: Record<string, Song> = Object.fromEntries(
  SONGS.map((song) => [song.id, song]),
)

/** All unique library/album names, in the order they first appear. */
export const LIBRARIES = [...new Set(SONGS.map((s) => s.library))]

/** Songs grouped by library name. */
export const SONGS_BY_LIBRARY: Record<string, Song[]> = Object.fromEntries(
  LIBRARIES.map((lib) => [lib, SONGS.filter((s) => s.library === lib)]),
)
