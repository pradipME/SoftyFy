// Dev-time utility: "give me a YouTube link" -> song added to the app.
//
// Chain:
//   1. yt-dlp downloads the audio as MP3 + the thumbnail as JPG
//   2. both are uploaded to Google Drive (scripts/drive-upload.mjs) and
//      made public ("anyone with the link")
//   3. scripts/add-song.mjs writes the entry into src/data/songs.ts with the
//      Drive URLs — nothing but text ever lands in this repo
//
// Usage:
//   node scripts/add-youtube-song.mjs \
//     --url "https://youtu.be/ABC123" \
//     --title "Song Title" \
//     --artist "Artist Name" \
//     [--library "Bathroom"]   (or "Qwali", or a new name) \
//     [--id "my-id"]           (default: slugified title) \
//     [--album "Album"]        [--duration 245]
//
// Requires on PATH: yt-dlp, ffmpeg, and rclone (or rclone installed via winget).

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const run = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULT_LIBRARY = 'Bathroom'

function usage() {
  console.log(`Usage:
  node scripts/add-youtube-song.mjs \\
    --url "https://youtu.be/..." \\
    --title "Song Title" \\
    --artist "Artist Name" \\
    [--library "Bathroom"]  [--id "my-id"]  [--album "Album"]  [--duration 245]
 → downloads, uploads to Google Drive, and adds the entry to songs.ts`)
}

function parseArgs(argv) {
  const getValue = (flag) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : undefined
  }
  return {
    url: getValue('--url'),
    title: getValue('--title'),
    artist: getValue('--artist'),
    library: getValue('--library') || DEFAULT_LIBRARY,
    album: getValue('--album') ?? '',
    id: getValue('--id'),
    duration: getValue('--duration'),
  }
}

function validate(args) {
  const errors = []
  if (!args.url) errors.push('--url is required')
  if (!args.title) errors.push('--title is required')
  if (!args.artist) errors.push('--artist is required')
  if (errors.length) {
    console.error('Error:'); for (const e of errors) console.error(`  - ${e}`); console.log('')
    usage(); process.exit(1)
  }
  return args
}

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'song'
}

async function ytdlp(args) {
  const { stdout } = await run('yt-dlp', args, { env: process.env, maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

async function downloadMp3(url, destBase) {
  await ytdlp([
    '-f', 'bestaudio/best',
    '-x', '--audio-format', 'mp3', '--audio-quality', '0',
    '-o', `${destBase}.%(ext)s`,
    url,
  ])
  const mp3 = `${destBase}.mp3`
  if (!existsSync(mp3)) throw new Error(`Expected MP3 at ${mp3}`)
  return mp3
}

async function downloadThumb(url, destBase) {
  await ytdlp([
    '--skip-download', '--write-thumbnail', '--convert-thumbnails', 'jpg',
    '-o', `${destBase}.%(ext)s`,
    url,
  ])
  const dir = dirname(destBase)
  const base = resolve(destBase)
  const entries = await readdir(dir)
  const match = entries
    .map((f) => join(dir, f))
    .find((f) => f.startsWith(base) && /\.(jpe?g|png|webp)$/i.test(f))
  if (!match) throw new Error('Could not find the downloaded thumbnail')
  return match
}

async function driveUpload(filePath, kind) {
  const { stdout } = await run('node', [resolve(__dirname, 'drive-upload.mjs'), '--file', filePath, '--kind', kind], {
    env: process.env, maxBuffer: 8 * 1024 * 1024,
  })
  const line = stdout.split(/\r?\n/).find((l) => kind === 'audio' ? l.startsWith('AUDIO_URL') : l.startsWith('COVER_URL'))
  const url = line?.split('\t')[1]
  if (!url) throw new Error(`drive-upload.mjs did not return a ${kind.toUpperCase()}_URL:\n${stdout}`)
  return url
}

async function runAddSong(args, audioUrl, coverUrl) {
  const cmdArgs = [
    resolve(__dirname, 'add-song.mjs'),
    '--id', args.id || slugify(args.title),
    '--title', args.title,
    '--artist', args.artist,
    '--library', args.library,
    '--audio', audioUrl,
    '--cover', coverUrl,
  ]
  if (args.album) cmdArgs.push('--album', args.album)
  if (args.duration !== undefined) cmdArgs.push('--duration', String(args.duration))
  const { stdout, stderr } = await run('node', cmdArgs, { env: process.env, maxBuffer: 8 * 1024 * 1024 })
  console.log(stdout.trim())
  if (stderr.trim()) console.error(stderr.trim())
}

async function main() {
  const args = validate(parseArgs(process.argv.slice(2)))
  const id = args.id || slugify(args.title)
  const work = await mkdtempSafe(id)
  try {
    console.log('1/4 Downloading MP3 ...')
    const mp3 = await downloadMp3(args.url, join(work, id))

    console.log('2/4 Downloading cover ...')
    const thumb = await downloadThumb(args.url, join(work, id))

    console.log('3/4 Uploading to Google Drive ...')
    const audioUrl = await driveUpload(mp3, 'audio')
    const coverUrl = await driveUpload(thumb, 'cover')

    console.log('4/4 Writing songs.ts ...')
    if (args.duration === undefined) {
      try {
        const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', mp3], { env: process.env })
        args.duration = String(Math.round(parseFloat(stdout.trim())))
      } catch {
        /* duration stays unknown -> 0, audio file provides it at runtime */
      }
    }
    await runAddSong(args, audioUrl, coverUrl)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

async function mkdtempSafe(prefix) {
  const dir = join(os.tmpdir(), `softyfy-${prefix}-`)
  return mkdir(dir, { recursive: true }).then(() => dir)
}

main().catch((err) => {
  console.error(String(err?.stderr || err?.message || err))
  process.exit(1)
})