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
    audioSrc: 'https://drive.usercontent.google.com/download?id=1XJlhmndIryOq2DhITg1vyP4lfG2TCI0P&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1UA8oK-Su_eDMcuEicnXv_PuF2LJy2n5Q&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Coke Studio Bharat',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1wakXiNlUK0Zsj0jrVsy_F2Ek4rAIxfyd&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1iTqZWvAHrKRGh4mONBtMmzgwzZivIeOA&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'gul',
    title: 'Gul',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1hWBkKhzwUx4tYvumzh398wBtnHQC9iCP&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1OTu8wPbKH2CXpHRs7fu2XiLrXq8ZOCB0&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'inaam-anuv-jain',
    title: 'Inaam',
    artist: 'Anuv Jain',
    album: 'Inaam',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1pNg8sB09ZPfgH5gGTn4a7XRx7mKtFGar&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1rNBDp4fp9qimg0RWPdzCIxWTeq7Y1NHD&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'afsanay',
    title: 'Afsanay',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1THbK-3iBX9olhW9sURgMm28fFIJS2cOc&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1RCJHQFznFXj1nlkg_xYN89JHw0zPCDEN&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'tera-mera-hai-pyar',
    title: 'Tera Mera Hai Pyar',
    artist: 'Ahmed Jahanzeb',
    album: 'Ishq Murshid',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1Zonu1bijXe30VuhkksrSd6pENkCyiP13&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=19FZD_0nIEGwK_B13OZBEIhsUvZdu_8QB&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'if-we-have-each-other',
    title: 'If We Have Each Other',
    artist: 'Alec Benjamin',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=15Kiu6Nlf_BohzlrVmDtlsUoSvB9IS4zy&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1ZJ83d81h2Uqagr7ieyZQwXoCcYzDNrVg&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'bairan',
    title: 'Bairan',
    artist: 'Banjaare',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1f-zenEg2ZA6eR5b6mbVm0YKa9ygCjZqQ&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1rmn9bXECqm_Epw2kFRn8CrYEU6cK4Mwv&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'barsaat-banjaare',
    title: 'Barsaat Banjaare',
    artist: 'Banjaare',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1P9Mqk4PQwmHj3zLKfF2rkccADs0xXKcY&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1evCdGbroyYWXNYh8xhcj9_bF6NtYWyUo&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'departure-lane',
    title: 'Departure Lane',
    artist: 'Talha Anjum, Umair',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1tCjsk6wBA30eWWDoj6TVsl0V1-HJ6CXz&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1HDEj5xFE0JMjxWMjDjKwkTnjf4NeeXQY&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'downers-at-dusk',
    title: 'Downers At Dusk',
    artist: 'Talha Anjum, Umair',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1PLu87dXFTmHxzTXAYfrPa4xMKALkfbMD&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1P5CyelMvL_l7NhHz_qe2NPfRGpyIZ2A3&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'him-and-i',
    title: 'Him & I',
    artist: 'G-Eazy feat. Halsey',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1oXdTWpsPOfxR2j8HlBpKN6AvbOUXWJ26&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=141-vdSeJBTDO7ESBhU7iYk5yg9kR7bgH&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'glass-half-full',
    title: 'Glass Half Full',
    artist: 'Talha Anjum, JJ47, Talhah Yunus',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=19ivUVqyT41mdSp6w7wUAfTEAtAX7a-1F&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1HKkgUG055mR75hhsJT9HC64xrq0swqkp&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'husn',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1wojcz1LDQXOrVBQl3GcFtJBUXevp1Ek3&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1k14IieyC6x1yPV6IK4kY01o7OwgEru-f&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'janam-janam',
    title: 'Janam Janam',
    artist: 'Arijit Singh, Antara Mitra',
    album: 'Dilwale',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=13_br_jipTqzqKBuHDnQqsmw2_m5N3cuA&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1K9Z85AXeOvQDt3Rb6xoqEqWapx7prxDF&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'jo-tum-mere-ho',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1Rc4f9n3S4_Lqky-W_5_gJ_ZEx-48ZH3Z&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1TLja5b7n50D1oWThfVG_9b5PfNNRIubD&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'long-time-no-see',
    title: 'Long Time No See',
    artist: 'Taimour Baig, AUR',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1ugSYzEqeUh47PsRTAmw7FKNuGtMQAncg&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1UDkxKofzrnC7Acf-YTiGaIKRzzZaJMnS&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'main-yahaan-hoon',
    title: 'Main Yahaan Hoon',
    artist: 'Udit Narayan',
    album: 'Veer-Zaara',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1ewAhSTamkJ7LOdNnvA8o17EVwT9NvfBC&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1xgKoryp7KOnY2bnPruMrfAK4rdVoPvgO&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'such-keh-raha-hai-rehnaa-hai-terre-dil-mein',
    title: 'Such Keh Raha Hai / Rehnaa Hai Terre Dil Mein',
    artist: 'Kumar Sanu, Alka Yagnik',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1KI9PCIJ9mXSGix07-GPT9CEPnuJHqOtI&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1U1KVXFH-sDHIbr1C8m22wrXkBZ_QbBgZ&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'gumaan',
    title: 'Gumaan',
    artist: 'Talha Anjum, Talhah Yunus, Young Stunners',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1ZNseuIPvIiC-Vv0DDNcrAho1dmk8Iot2&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1ElUeKEndMBltxidD9iyj9YESGMpB5_ba&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'tera-mera-rishta',
    title: 'Tera Mera Rishta',
    artist: 'Mustafa Zahid',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1uAM4kY71oI-wb2H1Z73OaR7cgLffxBY8&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1AxvxpwYcyPOrHCVayNkA-wB4sJqwGkb7&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'teri-yaad',
    title: 'Teri Yaad',
    artist: 'Unknown Artist',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1pNunucEE6WH1J1skcVtDrgMLQDLiO1gD&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1l2yXo2kN29gSSHnDCKj0jj5SHGYxDrGF&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'no-one-noticed',
    title: 'No One Noticed (Extended)',
    artist: 'The Marias',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1TylUNGi2oO-ecMvJViSkE5OV7qTbldzA&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=13u8gm6VGKz8E1cmo54EJaC2NPIEC7mVz&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'those-eyes',
    title: 'Those Eyes',
    artist: 'New West',
    album: '',
    durationSec: 0,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1lb8GpRqjfvQ3BIbpOrLnGX2fBXdJR7Lm&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1aex7q2wY1_M9VecqNtiU9PXCI2xFQx0K&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'faasle',
    title: 'Faasle',
    artist: 'Aditya Rikhari',
    album: 'Sometimes',
    durationSec: 222,
    audioSrc: 'https://drive.usercontent.google.com/download?id=15_n5fHV0hgwGCdAWYakXnFhjoAV6SdiI&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1W1Qtz-WdNDYKeog-DAgxcgE7j9vdJxeB&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'kashish',
    title: 'Kashish',
    artist: 'Ashish Bhatia, Omkar Singh, Kashish Ratnani',
    album: 'Sometimes',
    durationSec: 193,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1b7wYxlO0ctWCuV05PQSpbk1eGsHKFocM&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1vLWQTzYNPtxBUaeWkh6xEjeRoJLuIJ7x&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'paro',
    title: 'Paro',
    artist: 'Aditya Rikhari, UNPLG\'d',
    album: 'Sometimes',
    durationSec: 70,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1tyEdqc5NxnN-6ZZyacYAre0Pm_lxu4ey&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=14Du1qJxtkxXpCtOXF0xJxZOBj6Nt2KSJ&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'pills-on-my-mind',
    title: 'Pills On My Mind',
    artist: 'SarpDansh, Big Scratch',
    album: 'Sometimes',
    durationSec: 220,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1TS7OCBmsrDWEdNmFRfA-WVgqpxjIe5q_&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1bbbZGpx6aIhqkWsOusHHpKvzJThu3mjg&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'hasti-rahe-tu',
    title: 'Hasti Rahe Tu',
    artist: 'Paradox',
    album: 'Sometimes',
    durationSec: 185,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1ShI8MAReQeaCJz0X-IhPdvC5sqgj4Qnn&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=19gxm-4vsrqU07HBImclH-Y9MnS6CS-H8&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'raatein',
    title: 'Raatein',
    artist: 'PATHAK, Aviraag',
    album: 'Sometimes',
    durationSec: 235,
    audioSrc: 'https://drive.usercontent.google.com/download?id=16mK_C95soNSJIcOvE_EXAjdFKfSUcuwA&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1XVxgZMXBnDXae2NwFiZQmDAv_kHNVLZT&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'tum-mein-zamaana',
    title: 'TUM MEIN ZAMAANA',
    artist: 'Ajay Paul, Ronnik, ARMAAN PAUL',
    album: 'Sometimes',
    durationSec: 203,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1COF8mG9CuRbm-QUU9eangXv6EoOVRZ2U&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=10handHRTmjfVL-UaSsCIH7ArN9s3fcFr&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'lambiyan-judaiyan',
    title: 'Lambiyan Judaiyan',
    artist: 'Imran Raza',
    album: 'Sometimes',
    durationSec: 169,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1-fDJuKKmq4WJcIUMAsahZZAIsrmhdDQ7&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=15EB8rmb7VDFtb-C_DCf-0kASeawt-dHI&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'regrets',
    title: 'REGRETS',
    artist: 'Jevin Gill, Umair, Talha Anjum',
    album: 'Sometimes',
    durationSec: 243,
    audioSrc: 'https://drive.usercontent.google.com/download?id=12DokqYj_cm-vdNEIApLSCok5ef9G3DRd&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1z9YNIMv9WoNqPdzMYEyzRTqWeYld-5BB&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'savage-2-0',
    title: 'Savage 2.0',
    artist: 'SABR, Mohabbat Singh',
    album: 'Sometimes',
    durationSec: 135,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1TXmfKmFzPnZqPJtIuxMns7mx2uPPLIAo&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Ral3anzqNgW78tJ8aGCQUUv5UWpSmuPJ&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'aawaara-angaara',
    title: 'Aawaara Angaara',
    artist: 'A.R. Rahman, Faheem Abdullah, Irshad Kamil',
    album: 'Sometimes',
    durationSec: 311,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1YNKRQXc_vpF3HyflDdkgRIZK1MLg7DTn&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1_rjy3aMabtPQr4jVhNqeSAAf74uE9sUz&sz=w1000',
    library: 'Sometimes',
  },
  {
    id: 'be-safe',
    title: 'BE SAFE',
    artist: 'Taimour Baig, Raffey Anwar',
    album: 'Sometimes',
    durationSec: 165,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1K-AYhxoDzv920jqk2NDdlrksFkLo0gPb&export=download',
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
    audioSrc: 'https://drive.usercontent.google.com/download?id=1KRMfJvVth7MPzaQ83JlH4-Ma7Iy5hflX&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1aJfzomw0sagr_AcGDV8OQqgap4E1LJc7&sz=w1000',
    library: 'Qwali',
  },
  {
    id: 'main-teri-bahon',
    title: 'Main Teri Bahon Ke Jhule Me Pali Babul',
    artist: 'Lata Mangeshkar, Udit Narayan',
    album: '',
    durationSec: 437,
    audioSrc: 'https://drive.usercontent.google.com/download?id=10_fX_L-lWCzrMbOj4w3C-mHMuF7D65Dc&export=download',
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
    audioSrc: 'https://drive.usercontent.google.com/download?id=1LZwKOLbkHgoSth7qT68EHM4XLOVFdoqy&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'knock-knock',
    title: 'Knock Knock',
    artist: 'KR$NA, Phenom',
    album: 'Yours Truly',
    durationSec: 207,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1Yz8VvnbnN82SGZcc_P7fXoF_qcdspTWU&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'sensitive',
    title: 'Sensitive',
    artist: 'KR$NA, Seedhe Maut, Hurricane',
    album: 'Yours Truly',
    durationSec: 224,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1FoRGjOg-DWi1DW75SzPaT3MCPio2ux-I&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'never-enough',
    title: 'Never Enough',
    artist: 'KR$NA, Phenom',
    album: 'Yours Truly',
    durationSec: 173,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1tp9C49qELLbEzWPz5z7_tbsBMeiwYIpd&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'buss-down',
    title: 'Buss Down',
    artist: 'KR$NA, Raftaar, Phenom',
    album: 'Yours Truly',
    durationSec: 185,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1Sdn90sVwGu8N-7ACKnLa2cjcELu5ge9X&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'kkbn',
    title: 'KKBN',
    artist: 'KR$NA, Lambo Drive',
    album: 'Yours Truly',
    durationSec: 172,
    audioSrc: 'https://drive.usercontent.google.com/download?id=12Np3kxylRJsLN6XNRZIjPOJL6pvDw2Tu&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'talk-my-shit-guarantee',
    title: 'Talk My Shit/Guarantee',
    artist: 'KR$NA, Yashraj, NEVERSOBER',
    album: 'Yours Truly',
    durationSec: 239,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1iiuL3snj7YsWszO5FymC4xe5D6TLx-py&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'hello',
    title: 'Hello',
    artist: 'KR$NA, Awich, Karan Kanchan',
    album: 'Yours Truly',
    durationSec: 145,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1K_5OSlMox73cChGwhm4UYSZCvhUObg3b&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'vibrate',
    title: 'Vibrate',
    artist: 'KR$NA, Badshah, Phenom',
    album: 'Yours Truly',
    durationSec: 184,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1bbkD8LCkHRBnEgKBIPx7WsgfMrmKgguW&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'who-you-are',
    title: 'Who You Are',
    artist: 'KR$NA, Aitch, Phenom',
    album: 'Yours Truly',
    durationSec: 170,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1XAc7vULA-4z2ULwZUZg2f22aYuvyA0SI&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
  },
  {
    id: 'yours-truly',
    title: 'Yours Truly',
    artist: 'KR$NA',
    album: 'Yours Truly',
    durationSec: 294,
    audioSrc: 'https://drive.usercontent.google.com/download?id=1jtTRRf1NgmOhnA-wbQVL8bRIIKeIn3ib&export=download',
    coverSrc: 'https://drive.google.com/thumbnail?id=1Jj3oJOkfzS6fWXxPEBI7D2Ny1vD5Oy5f&sz=w1000',
    library: 'Yours Truly',
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


























