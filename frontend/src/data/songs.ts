import type { Song } from '../types/song'

// ===========================================================================
// YOUR SONGS LIVE HERE
// ---------------------------------------------------------------------------
// This is the ONLY file you normally need to edit. To add a song:
//
//   audioSrc / coverSrc accept BOTH:
//     - local files  "/audio/YOUR-FILE.mp3"  +  "/covers/YOUR-COVER.jpg"
//       (copy the files into public/audio and public/covers)
//     - full URLs    "https://.../song.mp3"  +  "https://.../cover.jpg"
//       (host songs on any external host — Google Drive, Dropbox, etc. —
//        nothing gets uploaded to this repo; playback works the same)
//
//   The fields per entry:
//        id         any short unique text (letters, numbers, dashes)
//        title      the song title
//        artist     the artist name
//        durationSec rough length in seconds — the real duration is read from
//                    the audio file automatically, so this is just a fallback
//        audioSrc   audio file: "/audio/X.mp3" or "https://..."
//        coverSrc   cover image: "/covers/X.jpg" or "https://..."
//        library    album name shown on Home (e.g. "Sometimes", "Qwali")
//
// Easiest way to add a song WITHOUT manual uploading:
//   node scripts/add-youtube-song.mjs --url "https://youtu.be/..." \
//     --title "Title" --artist "Artist" [--library "Bathroom"] [--id "id"]
//   → downloads, uploads to your Google Drive, links it publicly and adds
//     the entry for you.
//
// One-off / pre-existing files you already have:
//   node scripts/drive-upload.mjs --file "public/audio/X.mp3" --kind audio
//   node scripts/drive-upload.mjs --file "public/covers/X.jpg" --kind cover
//   then pass the printed AUDIO_URL / COVER_URL to add-song.mjs.
//
// Order matters — it's the order shown in Home and Library. Adding or removing
// entries will not break anything else.
// ===========================================================================

export const SONGS: Song[] = [
  // ── Sometimes ─────────────────────────────────────────────────────────────
  {
    id: 'afsos',
    title: 'Afsos',
    artist: 'Anuv Jain, AP Dhillon',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Afsos.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1UA8oK-Su_eDMcuEicnXv_PuF2LJy2n5Q&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Coke Studio Bharat',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Arz.Kiya.Hai._.Coke.Studio.Bharat.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1iTqZWvAHrKRGh4mONBtMmzgwzZivIeOA&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'gul',
    title: 'Gul',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Gul.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1OTu8wPbKH2CXpHRs7fu2XiLrXq8ZOCB0&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'inaam-anuv-jain',
    title: 'Inaam',
    artist: 'Anuv Jain',
    album: 'Inaam',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Inaam.Anuv.Jain.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1rNBDp4fp9qimg0RWPdzCIxWTeq7Y1NHD&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'afsanay',
    title: 'Afsanay',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Afsanay.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1RCJHQFznFXj1nlkg_xYN89JHw0zPCDEN&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'tera-mera-hai-pyar',
    title: 'Tera Mera Hai Pyar',
    artist: 'Ahmed Jahanzeb',
    album: 'Ishq Murshid',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Ahmed_Jahanzeb_-_Tera_Mera_Hai_Pyar_From_Ishq_Murshid_.mp3.pm.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=19FZD_0nIEGwK_B13OZBEIhsUvZdu_8QB&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'if-we-have-each-other',
    title: 'If We Have Each Other',
    artist: 'Alec Benjamin',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Alec_Benjamin_-_If_We_Have_Each_Other_.mp3.pm.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1ZJ83d81h2Uqagr7ieyZQwXoCcYzDNrVg&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'bairan',
    title: 'Bairan',
    artist: 'Banjaare',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Bairan.-.Bairan.320.kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1rmn9bXECqm_Epw2kFRn8CrYEU6cK4Mwv&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'barsaat-banjaare',
    title: 'Barsaat Banjaare',
    artist: 'Banjaare',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Barsaat.Banjaare.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1evCdGbroyYWXNYh8xhcj9_bF6NtYWyUo&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'departure-lane',
    title: 'Departure Lane',
    artist: 'Talha Anjum, Umair',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Departure.Lane.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1HDEj5xFE0JMjxWMjDjKwkTnjf4NeeXQY&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'downers-at-dusk',
    title: 'Downers At Dusk',
    artist: 'Talha Anjum, Umair',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Downers.At.Dusk.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1P5CyelMvL_l7NhHz_qe2NPfRGpyIZ2A3&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'him-and-i',
    title: 'Him & I',
    artist: 'G-Eazy feat. Halsey',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/G-Easy_feat._Halsey_-_Him_And_I_.mp3.pm.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=141-vdSeJBTDO7ESBhU7iYk5yg9kR7bgH&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'glass-half-full',
    title: 'Glass Half Full',
    artist: 'Talha Anjum, JJ47, Talhah Yunus',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Glass.Half.Full.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1HKkgUG055mR75hhsJT9HC64xrq0swqkp&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'husn',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Husn.Anuv.Jain.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1k14IieyC6x1yPV6IK4kY01o7OwgEru-f&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'janam-janam',
    title: 'Janam Janam',
    artist: 'Arijit Singh, Antara Mitra',
    album: 'Dilwale',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Janam.Janam.Dilwale.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1K9Z85AXeOvQDt3Rb6xoqEqWapx7prxDF&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'jo-tum-mere-ho',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Jo.Tum.Mere.Ho.Anuv.Jain.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1TLja5b7n50D1oWThfVG_9b5PfNNRIubD&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'long-time-no-see',
    title: 'Long Time No See',
    artist: 'Taimour Baig, AUR',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Long.Time.No.See.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1UDkxKofzrnC7Acf-YTiGaIKRzzZaJMnS&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'main-yahaan-hoon',
    title: 'Main Yahaan Hoon',
    artist: 'Udit Narayan',
    album: 'Veer-Zaara',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Main.Yahaan.Hoon.Veer.Zaara.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1xgKoryp7KOnY2bnPruMrfAK4rdVoPvgO&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'such-keh-raha-hai-rehnaa-hai-terre-dil-mein',
    title: 'Such Keh Raha Hai / Rehnaa Hai Terre Dil Mein',
    artist: 'Kumar Sanu, Alka Yagnik',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Such.Keh.Raha.Hai.Rehnaa.Hai.Terre.Dil.Mein.320.Kbps.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1U1KVXFH-sDHIbr1C8m22wrXkBZ_QbBgZ&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'gumaan',
    title: 'Gumaan',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Talha_Anjum_Talhah_Yunus_Young_Stunners_-_Gumaan_.mp3.pm.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1ElUeKEndMBltxidD9iyj9YESGMpB5_ba&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'tera-mera-rishta',
    title: 'Tera Mera Rishta',
    artist: 'Mustafa Zahid',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Tera.Mera.Rishta.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1AxvxpwYcyPOrHCVayNkA-wB4sJqwGkb7&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'teri-yaad',
    title: 'Teri Yaad',
    artist: 'Unknown Artist',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Teri.Yaad.PenduJatt.Com.Se.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1l2yXo2kN29gSSHnDCKj0jj5SHGYxDrGF&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'no-one-noticed',
    title: 'No One Noticed (Extended)',
    artist: 'The Marias',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/The_Mar_as_-_No_One_Noticed_Extended_English_.mp3.pm.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=13u8gm6VGKz8E1cmo54EJaC2NPIEC7mVz&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'those-eyes',
    title: 'Those Eyes',
    artist: 'New West',
    album: '',
    durationSec: 0,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Those_Eyes_-_New_West_.mp3.pm.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1aex7q2wY1_M9VecqNtiU9PXCI2xFQx0K&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'faasle',
    title: 'Faasle',
    artist: 'Aditya Rikhari',
    album: 'Sometimes',
    durationSec: 222,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/faasle.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1W1Qtz-WdNDYKeog-DAgxcgE7j9vdJxeB&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'kashish',
    title: 'Kashish',
    artist: 'Ashish Bhatia, Omkar Singh, Kashish Ratnani',
    album: 'Sometimes',
    durationSec: 193,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/kashish.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1vLWQTzYNPtxBUaeWkh6xEjeRoJLuIJ7x&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'paro',
    title: 'Paro',
    artist: 'Aditya Rikhari, UNPLG\'d',
    album: 'Sometimes',
    durationSec: 70,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/paro.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=14Du1qJxtkxXpCtOXF0xJxZOBj6Nt2KSJ&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'pills-on-my-mind',
    title: 'Pills On My Mind',
    artist: 'SarpDansh, Big Scratch',
    album: 'Sometimes',
    durationSec: 220,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/pills-on-my-mind.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1bbbZGpx6aIhqkWsOusHHpKvzJThu3mjg&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'hasti-rahe-tu',
    title: 'Hasti Rahe Tu',
    artist: 'Paradox',
    album: 'Sometimes',
    durationSec: 185,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/hasti-rahe-tu.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=19gxm-4vsrqU07HBImclH-Y9MnS6CS-H8&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'raatein',
    title: 'Raatein',
    artist: 'PATHAK, Aviraag',
    album: 'Sometimes',
    durationSec: 235,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/raatein.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1XVxgZMXBnDXae2NwFiZQmDAv_kHNVLZT&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'tum-mein-zamaana',
    title: 'TUM MEIN ZAMAANA',
    artist: 'Ajay Paul, Ronnik, ARMAAN PAUL',
    album: 'Sometimes',
    durationSec: 203,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/tum-mein-zamaana.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=10handHRTmjfVL-UaSsCIH7ArN9s3fcFr&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'lambiyan-judaiyan',
    title: 'Lambiyan Judaiyan',
    artist: 'Imran Raza',
    album: 'Sometimes',
    durationSec: 169,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/lambiyan-judaiyan.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=15EB8rmb7VDFtb-C_DCf-0kASeawt-dHI&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'regrets',
    title: 'REGRETS',
    artist: 'Jevin Gill, Umair, Talha Anjum',
    album: 'Sometimes',
    durationSec: 243,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/regrets.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1z9YNIMv9WoNqPdzMYEyzRTqWeYld-5BB&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'savage-2-0',
    title: 'Savage 2.0',
    artist: 'SABR, Mohabbat Singh',
    album: 'Sometimes',
    durationSec: 135,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/savage-2-0.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Ral3anzqNgW78tJ8aGCQUUv5UWpSmuPJ&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'aawaara-angaara',
    title: 'Aawaara Angaara',
    artist: 'A.R. Rahman, Faheem Abdullah, Irshad Kamil',
    album: 'Sometimes',
    durationSec: 311,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/aawaara-angaara.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1_rjy3aMabtPQr4jVhNqeSAAf74uE9sUz&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'be-safe',
    title: 'BE SAFE',
    artist: 'Taimour Baig, Raffey Anwar',
    album: 'Sometimes',
    durationSec: 165,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/be-safe.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1d2nYwLOQQnqGIvVSIgHUV0BIemBOkato&sz=w1000',
    library: 'Sometimes',
  },
  // ── Qwali ────────────────────────────────────────────────────────────────
  {
    id: 'tumhe-dillagi',
    title: 'Tumhe Dillagi Bhool Jani Padegi',
    artist: 'Nusrat Fateh Ali Khan, Purnam Allahabadi',
    album: '',
    durationSec: 983,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Tumhe.Dillagi.Bhool.Jani.Padegi.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1aJfzomw0sagr_AcGDV8OQqgap4E1LJc7&sz=w1000',
    library: 'Qwali',
  },
  {
    id: 'main-teri-bahon',
    title: 'Main Teri Bahon Ke Jhule Me Pali Babul',
    artist: 'Lata Mangeshkar, Udit Narayan',
    album: '',
    durationSec: 437,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Main.Teri.Bahon.Ke.Jhule.Me.Pali.Babul.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1K9TCm71L17GeiL3U0Ytj8TlfKzR5zP3X&sz=w1000',
    library: 'Qwali',
  },

  // ── Yours Truly ─────────────────────────────────────────────────────────
  {
    id: 'nothing-to-prove',
    title: 'Nothing to Prove',
    artist: 'KR$NA, Phenom',
    album: 'Yours Truly',
    durationSec: 200,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/nothing-to-prove.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'knock-knock',
    title: 'Knock Knock',
    artist: 'KR$NA, Phenom',
    album: 'Yours Truly',
    durationSec: 207,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/knock-knock.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'sensitive',
    title: 'Sensitive',
    artist: 'KR$NA, Seedhe Maut, Hurricane',
    album: 'Yours Truly',
    durationSec: 224,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/sensitive.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'never-enough',
    title: 'Never Enough',
    artist: 'KR$NA, Phenom',
    album: 'Yours Truly',
    durationSec: 173,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/never-enough.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'buss-down',
    title: 'Buss Down',
    artist: 'KR$NA, Raftaar, Phenom',
    album: 'Yours Truly',
    durationSec: 185,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/buss-down.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'kkbn',
    title: 'KKBN',
    artist: 'KR$NA, Lambo Drive',
    album: 'Yours Truly',
    durationSec: 172,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/kkbn.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'talk-my-shit-guarantee',
    title: 'Talk My Shit/Guarantee',
    artist: 'KR$NA, Yashraj, NEVERSOBER',
    album: 'Yours Truly',
    durationSec: 239,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/talk-my-shit-guarantee.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'hello',
    title: 'Hello',
    artist: 'KR$NA, Awich, Karan Kanchan',
    album: 'Yours Truly',
    durationSec: 145,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/hello.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'vibrate',
    title: 'Vibrate',
    artist: 'KR$NA, Badshah, Phenom',
    album: 'Yours Truly',
    durationSec: 184,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/vibrate.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'who-you-are',
    title: 'Who You Are',
    artist: 'KR$NA, Aitch, Phenom',
    album: 'Yours Truly',
    durationSec: 170,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/who-you-are.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'yours-truly',
    title: 'Yours Truly',
    artist: 'KR$NA',
    album: 'Yours Truly',
    durationSec: 294,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/yours-truly.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'summertime-sadness',
    title: 'Summertime Sadness',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 246,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/summertime-sadness.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'young-and-beautiful',
    title: 'Young And Beautiful',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 231,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/young-and-beautiful.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'video-games',
    title: 'Video Games',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 244,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/video-games.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'brooklyn-baby',
    title: 'Brooklyn Baby',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 345,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/brooklyn-baby.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'say-yes-to-heaven',
    title: 'Say Yes To Heaven',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 202,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/say-yes-to-heaven.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'born-to-die',
    title: 'Born To Die',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 280,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/born-to-die.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'diet-mountain-dew',
    title: 'Diet Mountain Dew',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 220,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/diet-mountain-dew.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'west-coast',
    title: 'West Coast',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 249,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/west-coast.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'cinnamon-girl',
    title: 'Cinnamon Girl',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 291,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/cinnamon-girl.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'blue-jeans',
    title: 'Blue Jeans',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 207,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/blue-jeans.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },
  {
    id: 'ride',
    title: 'Ride',
    artist: 'Lana Del Rey',
    album: 'The Weekends',
    durationSec: 286,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/ride.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1wzVw9GWvyu8pP5Z-ZxUWrXKqK-Mx7uDK&sz=w1000',
    library: 'The Weekends',
  },

  // ── Hindi Hits ──────────────────────────────────────────────────────────
  {
    id: 'aadat-se-majboor',
    title: 'Aadat Se Majboor',
    artist: 'Benny Dayal',
    album: 'Hindi Hits',
    durationSec: 122,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/aadat-se-majboor.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1NIjUVk44-w-Qg9xYj87GEP2HIUZ-rFAc&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'love-dose',
    title: 'Love Dose',
    artist: 'Yo Yo Honey Singh',
    album: 'Hindi Hits',
    durationSec: 165,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/love-dose.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1W7XfvIvL1Z9yoAKBCaVhJbenGEnFZexY&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'pungi',
    title: 'Pungi',
    artist: 'Mika Singh',
    album: 'Hindi Hits',
    durationSec: 201,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/pungi.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=10MzPnXd_nYJ1mqZ1NvihMfBMHaH8NR1h&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'thug-le',
    title: 'Thug Le',
    artist: 'Vishal Dadlani & Shweta Pandit',
    album: 'Hindi Hits',
    durationSec: 196,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/thug-le.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1cOUQLU8dfh2oQKC41I7BOMvU4UHy_Iwb&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'party-all-night',
    title: 'Party All Night',
    artist: 'Yo Yo Honey Singh',
    album: 'Hindi Hits',
    durationSec: 244,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/party-all-night.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=195b8_OLkfEefDNwWKu5FgsZVNTaqqKOk&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'johnny-johnny',
    title: 'Johnny Johnny',
    artist: 'Sachin-Jigar',
    album: 'Hindi Hits',
    durationSec: 183,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/johnny-johnny.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1AVi0785tGIpdYDBZQcNqfU26JRvlRb34&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'party-with-bhoothnath',
    title: 'Party With Bhoothnath',
    artist: 'Yo Yo Honey Singh',
    album: 'Hindi Hits',
    durationSec: 168,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/party-with-bhoothnath.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1GxFfB8hmIfVHn-yH9dtQNRXMg6Tq74fm&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'manma-emotion-jaage',
    title: 'Manma Emotion',
    artist: 'Amit Mishra, Anushka Manchanda & Antara Mitra',
    album: 'Hindi Hits',
    durationSec: 154,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/manma-emotion-jaage.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1WTNBheI6ZLZ1bmZkfAxN5zPlB4rsWL_h&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'i-hate-luv-storys',
    title: 'I Hate Luv Storys',
    artist: 'Vishal Dadlani',
    album: 'Hindi Hits',
    durationSec: 146,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/i-hate-luv-storys.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1NvDXyM8_XDZXe0kvtK9tzf5djza7VXpI&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'character-dheela',
    title: 'Character Dheela',
    artist: 'Neeraj Shridhar & Amrita Kak',
    album: 'Hindi Hits',
    durationSec: 202,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/character-dheela.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1FSyG_41T0ctWTCf2hxY3u8bJmG9ivhst&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'babli-badmaash',
    title: 'Babli Badmaash',
    artist: 'Sunidhi Chauhan',
    album: 'Hindi Hits',
    durationSec: 156,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/babli-badmaash.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1yP3dSfjRDw7fYW03zrlbRFWTSidmjF4r&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'yaar-na-miley',
    title: 'Yaar Na Miley',
    artist: 'Yo Yo Honey Singh',
    album: 'Hindi Hits',
    durationSec: 152,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/yaar-na-miley.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1F8OogCIVY9wMwdKqM9IVZmOI-LC2jnEw&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'patli-kamariya',
    title: 'Patli Kamariya',
    artist: 'Tanishk Bagchi, Sukh-E Muzical Doctorz & Parampara Tandon',
    album: 'Hindi Hits',
    durationSec: 151,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/patli-kamariya.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1JVoRw_abuYBUrZ1p6U5mOkt3iMQEJ2yT&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'shararat',
    title: 'Shararat',
    artist: 'Shashwat Sachdev, Madhubanti Bagchi & Jasmine Sandlas',
    album: 'Hindi Hits',
    durationSec: 157,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/shararat.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1LyNfqVTM9oljqmupXmNXlJRfafv_ouTj&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'aaj-raat-ka-scene',
    title: 'Aaj Raat Ka Scene',
    artist: 'Badshah & Shraddha Pandit',
    album: 'Hindi Hits',
    durationSec: 189,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/aaj-raat-ka-scene.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=11JAiBj__U2HKFRWvKEY7LCcpFd_XJ977&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'aankh-lad-jaave',
    title: 'Aankh Lad Jaave',
    artist: 'Badshah, Tanishk Bagchi, Jubin Nautiyal & Asees Kaur',
    album: 'Hindi Hits',
    durationSec: 173,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/aankh-lad-jaave.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1v49zjRwUXQ_Wjb5fHx19m6E07SByLACi&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'galat-baat',
    title: 'Galat Baat',
    artist: 'Neeti Mohan & Javed Ali',
    album: 'Hindi Hits',
    durationSec: 161,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/galat-baat.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1t_cN22_i5x2veAN3kxyQ1hOeAgEppN6Y&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'the-break-up-song',
    title: 'The Break Up Song',
    artist: 'Arijit Singh, Badshah, Jonita Gandhi & Nakash Aziz',
    album: 'Hindi Hits',
    durationSec: 141,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/the-break-up-song.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=15n7krHEzo_bjaqruPRUOwBie6fJwnyaI&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'nachenge-saari-raat',
    title: 'Nachenge Saari Raat',
    artist: 'Meet Bros, Neeraj Shridhar & Tulsi Kumar',
    album: 'Hindi Hits',
    durationSec: 222,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/nachenge-saari-raat.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=14IOH_67JS08UG4obPuKhaLRJYtftR3BF&sz=w1000',
    library: 'Hindi Hits',
  },
  {
    id: 'lattoo',
    title: 'Lattoo',
    artist: 'Shreya Ghoshal',
    album: 'Hindi Hits',
    durationSec: 172,
    audioSrc: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/lattoo.mp3',
    coverSrc: 'https://drive.google.com/thumbnail?id=1nDDF7Ymzq9XSSK2kQ4Rs_lIqmU06OjrX&sz=w1000',
    library: 'Hindi Hits',
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














































