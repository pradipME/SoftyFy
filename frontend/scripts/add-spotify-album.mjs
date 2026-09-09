// Dev-time utility: add a whole Spotify album/playlist to the app.
//
// Spotify files are DRM-protected, so each track is instead matched on YouTube
// (auto: top result of "artist - title") and fed through the same chain as
// add-youtube-song.mjs -> Google Drive -> src/data/songs.ts.
//
// Usage:
//   node scripts/add-spotify-album.mjs --url "https://open.spotify.com/album/..."
//   node scripts/add-spotify-album.mjs --url "https://open.spotify.com/playlist/..."
//   [--library "Yours Truly"]  [--include-skits]  [--limit 5]
//
// Defaults:
//   - library  = album/playlist name
//   - tracks called "… SKIT …" are skipped unless --include-skits
//   - downloads continue on per-track failures; a summary is printed at the end

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const run = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const DRIVE_SCRIPT = resolve(__dirname, 'drive-upload.mjs')
const ADD_SONG_SCRIPT = resolve(__dirname, 'add-song.mjs')

function usage() {
  console.log(`Usage:
  node scripts/add-spotify-album.mjs --url "spotify album/playlist url" \\
    [--library "Name"]  [--include-skits]  [--limit N]`)
}

function parseArgs(argv) {
  const getValue = (flag) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : undefined
  }
  return {
    url: getValue('--url'),
    library: getValue('--library'),
    includeSkits: argv.includes('--include-skits'),
    limit: getValue('--limit'),
  }
}

async function fetchEmbedData(url) {
  const m = url.match(/open\.spotify\.com\/(album|playlist)\/([A-Za-z0-9]+)/)
  if (!m) throw new Error('Not a Spotify album/playlist link: ' + url)
  const [, type, id] = m
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`
  const html = await (await fetch(embedUrl)).text()
  const mm = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!mm) throw new Error('Could not find track data on Spotify embed page')
  const state = JSON.parse(mm[1]).props.pageProps.state.data.entity
  if (!state.trackList) throw new Error('Spotify entity has no trackList')
  return { type, entity: state }
}

async function fetchAlbumCover(url) {
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
  if (res.ok) {
    const data = await res.json()
    if (data.thumbnail_url) return data.thumbnail_url
  }
  return null
}

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'track'
}

async function ytdlp(args) {
  const { stdout } = await run('yt-dlp', args, { env: process.env, maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

async function downloadSearchMp3(query, destBase) {
  await ytdlp([
    '--no-playlist',
    '-f', 'bestaudio/best',
    '-x', '--audio-format', 'mp3', '--audio-quality', '0',
    '-o', `${destBase}.%(ext)s`,
    `ytsearch1:${query}`,
  ])
  const mp3 = `${destBase}.mp3`
  if (!existsSync(mp3)) throw new Error(`Expected MP3 at ${mp3}`)
  return mp3
}

async function downloadImageToFile(imageUrl, destPath) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Image download failed: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buf)
  return destPath
}

async function driveUpload(filePath, kind) {
  const { stdout } = await run('node', [DRIVE_SCRIPT, '--file', filePath, '--kind', kind], {
    env: process.env, maxBuffer: 8 * 1024 * 1024,
  })
  const line = stdout.split(/\r?\n/).find((l) =>
    kind === 'audio' ? l.startsWith('AUDIO_URL') : l.startsWith('COVER_URL'))
  const url = line?.split('\t')[1]
  if (!url) throw new Error(`drive-upload.mjs did not return a ${kind.toUpperCase()}_URL:\n${stdout}`)
  return url
}

async function runAddSong(song) {
  const cmdArgs = [
    ADD_SONG_SCRIPT,
    '--id', song.id,
    '--title', song.title,
    '--artist', song.artist,
    '--library', song.library,
    '--album', song.album,
    '--audio', song.audio,
    '--cover', song.cover,
    '--duration', String(song.durationSec),
  ]
  const { stdout, stderr } = await run('node', cmdArgs, { env: process.env, maxBuffer: 8 * 1024 * 1024 })
  if (stdout.trim()) console.log(stdout.trim())
  if (stderr.trim()) console.error(stderr.trim())
}

function splitArtists(subtitle) {
  return String(subtitle).split(',').map((s) => s.trim()).filter(Boolean)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.url) {
    console.error('Error: --url is required')
    usage(); process.exit(1)
  }
  const { entity } = await fetchEmbedData(args.url)
  const albumName = entity.name
  const library = args.library || albumName
  const albumSlug = slugify(albumName)
  const tracks = entity.trackList

  console.log(`Album: "${albumName}" — ${entity.subtitle} (${tracks.length} tracks)`)

  let plan = tracks.map((t, i) => ({ ...t, n: i + 1 }))
  if (!args.includeSkits) {
    const before = plan.length
    plan = plan.filter((t) => !/skit/i.test(t.title))
    const skipped = before - plan.length
    if (skipped) console.log(`Skipping ${skipped} SKIT track(s)`)
  }
  if (args.limit !== undefined) plan = plan.slice(0, Number(args.limit))

  const work = join(os.tmpdir(), `softyfy-spotify-${albumSlug}-`)
  await mkdir(work, { recursive: true })

  let coverUrl = ''
  try {
    console.log('Getting album cover ...')
    const coverRemote = await fetchAlbumCover(args.url)
    const coverLocal = join(work, `${albumSlug}.jpg`)
    if (coverRemote) {
      await downloadImageToFile(coverRemote, coverLocal)
      coverUrl = await driveUpload(coverLocal, 'cover')
    }
  } catch (err) {
    console.warn(`Cover failed (continuing): ${String(err?.message || err)}`)
  }

  const usedIds = new Set()
  let added = 0
  let failedList = []

  if (!coverUrl) {
    console.error('Could not get an album cover; aborting before downloading tracks.')
    process.exit(1)
  }

  for (const t of plan) {
    const id = makeUniqueId(usedIds, slugify(t.title))
    const artists = splitArtists(t.subtitle)
    const artist = artists.join(', ')
    const query = `${artists[0] || artist} - ${t.title}`
    try {
      process.stderr.write(`[${t.n}/${entity.trackList.length}] ${artist} - ${t.title} ... `)
      const mp3 = await downloadSearchMp3(query, join(work, id))
      const audioUrl = await driveUpload(mp3, 'audio')
      await runAddSong({
        id, title: t.title, artist, library, album: albumName,
        audio: audioUrl, cover: coverUrl, durationSec: Math.round(t.duration / 1000),
      })
      process.stderr.write('OK\n')
      added += 1
    } catch (err) {
      process.stderr.write(`FAILED: ${String(err?.stderr || err?.message || err)}\n`)
      failedList.push(`${t.title}`)
    }
  }

  await rm(work, { recursive: true, force: true })

  console.log(`\nDone: ${added}/${plan.length} added to library "${library}".`)
  if (failedList.length) {
    console.log('Failed:')
    for (const f of failedList) console.log(`  - ${f}`)
  }
}

function makeUniqueId(usedIds, base) {
  let id = base
  let i = 2
  while (usedIds.has(id)) id = `${base}-${i++}`
  usedIds.add(id)
  return id
}

main().catch((err) => {
  console.error(String(err?.stderr || err?.message || err))
  process.exit(1)
})