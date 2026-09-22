// Dev-time utility: transcode every song's high-quality audio (hosted on the
// GitHub Release "softyfy-audio-v1") into a low-bitrate MP3 twin.
//
// The app picks between HQ and LQ once, at load time, based on the connection
// (see pickAudioSource in src/lib/audioSources.ts). Songs whose src lives on
// the Release asset host are downloaded here, re-encoded locally with ffmpeg,
// and written as "<asset-name>-<suffix>.mp3" — the suffix usually being `lq`
// so the final naming convention is "<original-filename>-lq.mp3".
//
// This script NEVER uploads anything. Generated files are meant to be attached
// to the existing Release manually (drag-and-drop) or with a single
// `gh release upload` command, which this script prints for review. Running a
// tight loop of GitHub API uploads is deliberately avoided (same abuse-flag
// caution that killed Google Drive streaming).
//
// Usage:
//   node scripts/generate-low-bitrate.mjs                      # all songs, 128k stereo, suffix "lq"
//   node scripts/generate-low-bitrate.mjs --bitrate 96         # 96 kb/s
//   node scripts/generate-low-bitrate.mjs --channels mono      # mono (bigger savings)
//   node scripts/generate-low-bitrate.mjs --only afsos         # one song by songs.ts id
//   node scripts/generate-low-bitrate.mjs --only "Gul.PenduJatt.Com.Se.mp3"  # ...or by asset filename
//   node scripts/generate-low-bitrate.mjs --out out/lq         # custom output dir
//   node scripts/generate-low-bitrate.mjs --suffix lq-96k-mono # custom filename suffix
//
// Requires on PATH: ffmpeg + ffprobe (both confirmed in this environment).

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, stat } from 'node:fs/promises'
import { createWriteStream, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')

const RELEASE_RE = new RegExp(
  String.raw`https://github\.com/[^/]+/[^/]+/releases/download/softyfy-audio-v1/([^/)]+)`,
)

const DEFAULT_BITRATE = 128
const DEFAULT_CHANNELS = 'stereo'
const DEFAULT_SUFFIX = 'lq'
const DEFAULT_OUT = resolve(__dirname, 'lq-output')

function usage() {
  console.log(`Usage:
  node scripts/generate-low-bitrate.mjs [--bitrate 96|128] [--channels mono|stereo]
    [--suffix lq] [--only <song-id|filename-fragment>] [--out <dir>]
 → downloads HQ files from the GitHub Release, re-encodes to low-bitrate MP3,
   and prints upload-ready filenames + sizes + a single gh release upload command`)
}

function parseArgs(argv) {
  const next = (flag, fallback) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    usage()
    process.exit(0)
  }
  return {
    bitrate: Number(next('--bitrate', String(DEFAULT_BITRATE))),
    channels: next('--channels', DEFAULT_CHANNELS),
    suffix: next('--suffix', DEFAULT_SUFFIX),
    only: next('--only', null),
    out: resolve(next('--out', DEFAULT_OUT)),
  }
}

function validate(args) {
  const errors = []
  if (!Number.isFinite(args.bitrate) || args.bitrate < 32 || args.bitrate > 320) {
    errors.push('--bitrate must be an integer between 32 and 320')
  }
  if (args.channels !== 'mono' && args.channels !== 'stereo') {
    errors.push("--channels must be 'mono' or 'stereo'")
  }
  if (errors.length) {
    console.error('Error:'); for (const e of errors) console.error(`  - ${e}`); console.log('')
    usage(); process.exit(1)
  }
  return args
}

/** Parses src/data/songs.ts into { id, title, filename, library } for Release-hosted songs. */
function readReleaseSongs() {
  const source = readFileSync(join(REPO, 'src', 'data', 'songs.ts'), 'utf8')
  // id → title → (optional audioSrcLQ) → audioSrc → library inside each {...} entry.
  const entryRe =
    /\{\s*?id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?audioSrc:\s*'([^']+)'[\s\S]*?library:\s*'([^']+)'/g
  const songs = []
  let m
  while ((m = entryRe.exec(source)) !== null) {
    const [, id, title, audioSrc, library] = m
    const fm = RELEASE_RE.exec(audioSrc)
    if (fm) songs.push({ id, title, filename: fm[1], library })
  }
  return songs
}

/** Streams a URL to a local file (redirects followed), with transient retries. */
async function download(url, dest, attempts = 4) {
  let lastErr
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'softyfy-lowbitrate-tool' } })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`)
      await mkdir(dirname(dest), { recursive: true })
      await finished(Readable.fromWeb(res.body).pipe(createWriteStream(dest)))
      return
    } catch (err) {
      lastErr = err
      if (attempt < attempts) {
        const waitMs = 1500 * 2 ** (attempt - 1)
        console.log(`    retry ${attempt}/${attempts - 1} in ${waitMs}ms ...`)
        await new Promise((r) => setTimeout(r, waitMs))
      }
    }
  }
  throw lastErr
}

async function fileSizes(path) {
  try {
    const s = await stat(path)
    return s.size
  } catch {
    return null
  }
}

/** Gathers per-asset source bytes directly from the Release (HEAD-like via Range) to avoid re-downloading. */
async function remoteSize(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(15000), redirect: 'follow' })
    const cr = res.headers.get('content-range') || ''
    const m = /bytes \d+-\d+\/(\d+)/.exec(cr)
    if (m) return Number(m[1])
    const len = Number(res.headers.get('content-length'))
    if (Number.isFinite(len) && len > 0) return len
    return null
  } catch {
    return null
  }
}

function probeAudio(path) {
  return run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration,bit_rate',
    '-of', 'json',
    path,
  ]).then(({ stdout }) => {
    const parsed = JSON.parse(stdout)
    const fmt = parsed.format ?? {}
    return {
      durationSec: Number(fmt.duration) || 0,
      bitrate: Number(fmt.bit_rate) || 0,
    }
  }).catch(() => ({ durationSec: 0, bitrate: 0 }))
}

async function transcode(input, output, args) {
  const ac = args.channels === 'mono' ? '1' : '2'
  await run('ffmpeg', [
    '-y', '-i', input,
    '-map_metadata', '0',
    '-id3v2_version', '3',
    '-codec:a', 'libmp3lame',
    '-b:a', String(args.bitrate) + 'k',
    '-ar', '44100',
    '-ac', ac,
    output,
  ], { maxBuffer: 16 * 1024 * 1024 })
}

function formatBytes(n) {
  if (n === null) return 'n/a'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let i = 0
  const worker = async () => {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function main() {
  const args = validate(parseArgs(process.argv.slice(2)))
  let songs = readReleaseSongs()

  if (args.only) {
    songs = songs.filter((s) => s.id === args.only || s.filename.includes(args.only))
    if (songs.length === 0) {
      console.error(`No song matched --only "${args.only}".`)
      process.exit(1)
    }
  }

  const srcDir = join(args.out, 'src')
  const rows = []
  const failures = []

  await mapLimit(songs, 1, async (song) => {
    const releaseUrl = `https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/${encodeURIComponent(song.filename)}`
    const input = join(srcDir, song.filename)
    const output = join(args.out, `${song.filename}-${args.suffix}.mp3`)

    console.log(`\n[${song.id}] ${song.filename}`)
    try {
      if (!existsSync(input)) {
        console.log('  downloading HQ from Release ...')
        await download(releaseUrl, input)
      } else {
        console.log('  using cached HQ file')
      }

      if (!existsSync(output)) {
        console.log(`  transcoding → ${args.bitrate}k ${args.channels} → ${song.filename}-${args.suffix}.mp3`)
        await transcode(input, output, args)
      } else {
        console.log('  output already exists, keeping it')
      }

      const srcBytes = await fileSizes(input)
      const outBytes = await fileSizes(output)
      const remote = srcBytes === null ? await remoteSize(releaseUrl) : null
      const info = await probeAudio(output)
      rows.push({
        id: song.id,
        library: song.library,
        filename: `${song.filename}-${args.suffix}.mp3`,
        outBytes,
        srcBytes: srcBytes ?? remote,
        bitrate: info.bitrate,
        duration: info.durationSec,
      })
    } catch (err) {
      failures.push({ id: song.id, filename: song.filename, error: String(err?.message || err).slice(0, 140) })
      console.log(`  FAILED: ${String(err?.message || err).slice(0, 140)}`)
    }
  })

  if (failures.length) {
    console.log(`\n\n!! ${failures.length} songs failed — re-run this command to continue (completed files are skipped):`)
    for (const f of failures) console.log(`  [${f.id}] ${f.filename}: ${f.error}`)
  }

  console.log('\n\n' + '='.repeat(92))
  console.log(`GENERATED ${rows.length} LOW-BITRATE FILES  (${args.bitrate} kb/s ${args.channels}, suffix "-${args.suffix}")`)
  console.log('='.repeat(92))
  console.log('filename\tHQsizedownloaded)\tLQsize\tbitrate\tduration\tsaved')
  for (const r of rows) {
    const saved = r.srcBytes && r.outBytes ? (100 * (1 - r.outBytes / r.srcBytes)) : null
    console.log([
      r.filename,
      formatBytes(r.srcBytes),
      formatBytes(r.outBytes),
      r.bitrate ? `${Math.round(r.bitrate / 1000)}k` : 'n/a',
      `${Math.round(r.duration)}s`,
      saved !== null ? `${saved.toFixed(0)}%` : '',
    ].join('\t'))
  }

  console.log('\n' + '='.repeat(92))
  console.log('UPLOAD (review & run these yourself — the script never uploads):')
  const groups = new Map()
  for (const r of rows) {
    if (!groups.has(r.library)) groups.set(r.library, [])
    groups.get(r.library).push(r.filename)
  }
  for (const [lib, files] of groups) {
    const quoted = files.map((f) => `"${join(args.out, f)}"`).join(' ')
    console.log(`  gh release upload softyfy-audio-v1 --repo pradipME/SoftyFy ${quoted}   # ${lib} (${files.length})`)
  }
  console.log('\nOr drag-and-drop the files above into the release at:')
  console.log('  https://github.com/pradipME/SoftyFy/releases/edit/softyfy-audio-v1')
}

main().catch((err) => {
  console.error(String(err?.stderr || err?.message || err))
  process.exit(1)
})