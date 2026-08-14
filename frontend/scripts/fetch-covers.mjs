// Dev-time utility: fetch album art for every song from a public metadata API.
//
//   Primary:   iTunes Search API (free, no key)
//   Fallback:  MusicBrainz + Cover Art Archive (free, no key; requires User-Agent)
//
// For each song in src/data/songs.ts it:
//   - queries iTunes with title + artist (title only when artist is "Unknown Artist")
//   - downloads the best-matching artwork (upgraded to 600x600) into
//     public/covers/{id}.jpg
//   - falls back to MusicBrainz/Cover Art Archive when iTunes has no match
//   - leaves the existing placeholder SVG untouched when nothing is found
//   - skips songs that already have a real (non-placeholder) cover
//
// Usage:  node scripts/fetch-covers.mjs
// Env:    ITUNES_DELAY_MS / MB_DELAY_MS to tune request spacing.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SONGS_PATH = resolve(ROOT, 'src/data/songs.ts')
const COVERS_DIR = resolve(ROOT, 'public/covers')

const USER_AGENT = 'SoftyFy-dev/0.1 (personal local music app; cover fetch for private library)'
const ITUNES_DELAY = Number(process.env.ITUNES_DELAY_MS ?? 400)
const MB_DELAY = Number(process.env.MB_DELAY_MS ?? 600)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Normalize for matching: strip parens/brackets and non-word chars. */
const norm = (s) =>
  String(s || '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Loose equality: exact, containment, or small typo distance. */
function similar(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  if (a.length >= 5 && (a.includes(b) || b.includes(a))) return true
  if (Math.max(a.length, b.length) >= 6) {
    const dist = levenshtein(a, b)
    if (dist <= 2) return true
    if (dist <= Math.floor(Math.max(a.length, b.length) / 4) + 1) return true
  }
  return false
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

const PLACEHOLDER_RE = /^\/covers\/track-\d+\.svg$/

/** Lightweight parse of the SONGS entries — no TS toolchain needed. */
function parseSongs(src) {
  const entries = []
  const blockRe = /\{\s*id:\s*'([^']+)',([\s\S]*?)\n\s*\},/g
  const field = (block, re) => block.match(re)?.[1] ?? ''
  for (const m of src.matchAll(blockRe)) {
    const block = m[0]
    entries.push({
      id: m[1],
      title: field(block, /title:\s*'([^']*)'/),
      artist: field(block, /artist:\s*'([^']*)'/),
      audioSrc: field(block, /audioSrc:\s*'([^']*)'/),
      coverSrc: field(block, /coverSrc:\s*'([^']*)'/),
    })
  }
  if (entries.length === 0) throw new Error('Could not parse any songs from songs.ts')
  return entries
}

function searchTerm(song, title) {
  const artist = song.artist && song.artist !== 'Unknown Artist' ? song.artist : ''
  return [artist, title].filter(Boolean).join(' ')
}

function scoreResult(result, song, candidateTitle) {
  const track = norm(result.trackName ?? result.trackCensoredName ?? '')
  const artist = norm(result.artistName ?? '')
  const target = norm(candidateTitle)
  const targetArtist = norm(song.artist)
  if (!track || !similar(track, target)) return -1
  let s = 50
  if (targetArtist && targetArtist !== 'unknown artist') {
    if (artist === targetArtist) s += 50
    else if (similar(artist, targetArtist)) s += 25
    else s -= 15
  }
  return s
}

async function itunes(song, title) {
  const url =
    'https://itunes.apple.com/search?entity=song&media=music&limit=5&term=' +
    encodeURIComponent(searchTerm(song, title))
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) return null
  const json = await res.json()
  if (!json.resultCount) return null
  const candidates = json.results
    .map((r) => ({ result: r, score: scoreResult(r, song, title) }))
    .filter((c) => c.score >= 0)
    .sort((a, b) => b.score - a.score)
  if (candidates.length === 0) return null
  const { result } = candidates[0]
  const art = result.artworkUrl100 || result.artworkUrl60
  if (!art) return null
  const size = art.includes('100x100') ? '100x100' : art.includes('60x60') ? '60x60' : null
  return {
    source: 'itunes',
    label: `${result.trackName} — ${result.artistName}`,
    url: size ? art.replace(size, '600x600') : art,
  }
}

/** Candidate titles to try: the full title plus each slash-separated part. */
function candidateTitles(song) {
  const parts = String(song.title)
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
  const list = parts.length > 1 ? [song.title, ...parts] : [song.title]
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))]
}

async function musicbrainz(song) {
  await sleep(MB_DELAY)
  const lucene = `recording:${quotePhrase(song.title)} AND artist:${quotePhrase(song.artist)}`
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(lucene)}&fmt=json&limit=5`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) return null
  const json = await res.json()
  const target = norm(song.title)
  const rec = (json.recordings || []).find((r) => norm(r.title) === target)
  if (!rec || !rec.releases || rec.releases.length === 0) return null
  const release = rec.releases[0]
  const targets = [release['release-group']?.id, release.id].filter(Boolean)
  for (const mbid of targets) {
    await sleep(MB_DELAY)
    const caa = `https://coverartarchive.org/release-group/${mbid}/front-500`
    const caaRes = await fetch(caa, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
    if (caaRes.ok) {
      return {
        source: 'coverartarchive',
        label: `${rec.title} — ${rec['artist-credit']?.[0]?.name ?? '?'}`,
        url: caaRes.url,
      }
    }
  }
  return null
}

function quotePhrase(s) {
  return `"${String(s).replace(/"/g, '')}"`
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000) throw new Error('response too small to be a cover')
  await writeFile(dest, buf)
  return buf.length
}

const main = async () => {
  const src = await readFile(SONGS_PATH, 'utf8')
  const songs = parseSongs(src)
  await mkdir(COVERS_DIR, { recursive: true })
  console.log(`Found ${songs.length} songs.`)

  const updates = [] // { oldCover, newCover }
  const matched = []
  const skipped = []

  for (let i = 0; i < songs.length; i += 1) {
    const song = songs[i]
    const isPlaceholder = PLACEHOLDER_RE.test(song.coverSrc)
    if (!isPlaceholder) {
      console.log(`[${i + 1}/${songs.length}] SKIP (already has real cover) ${song.id}`)
      skipped.push({ id: song.id, reason: 'already has a real cover' })
      continue
    }

    await sleep(ITUNES_DELAY)
    let hit = null
    for (const title of candidateTitles(song)) {
      hit = await itunes(song, title)
      if (hit) break
      await sleep(ITUNES_DELAY)
    }
    if (!hit) {
      hit = await musicbrainz(song)
    }

    if (!hit) {
      console.log(`[${i + 1}/${songs.length}] NO MATCH ${song.id} (${song.title})`)
      skipped.push({ id: song.id, reason: 'no match on iTunes or MusicBrainz' })
      continue
    }

    const dest = resolve(COVERS_DIR, `${song.id}.jpg`)
    try {
      const bytes = await download(hit.url, dest)
      console.log(`[${i + 1}/${songs.length}] OK ${song.id} <- ${hit.label} (${hit.source}, ${bytes} bytes)`)
      updates.push({ oldCover: song.coverSrc, newCover: `/covers/${song.id}.jpg` })
      matched.push(song.id)
    } catch (err) {
      console.log(`[${i + 1}/${songs.length}] FAIL ${song.id} download: ${err.message}`)
      skipped.push({ id: song.id, reason: `download failed: ${err.message}` })
    }
  }

  if (updates.length > 0) {
    let out = src
    for (const u of updates) {
      if (!out.includes(`coverSrc: '${u.oldCover}'`)) {
        console.error(`WARN: coverSrc '${u.oldCover}' not found in songs.ts`)
        continue
      }
      out = out.replace(`coverSrc: '${u.oldCover}'`, `coverSrc: '${u.newCover}'`)
    }
    await writeFile(SONGS_PATH, out)
    console.log(`\nUpdated ${updates.length} coverSrc values in songs.ts`)
  }

  console.log(`\nMatched (${matched.length}): ${matched.join(', ') || '(none)'}`)
  console.log(`Skipped (${skipped.length}):`)
  for (const s of skipped) console.log(`  - ${s.id}: ${s.reason}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
