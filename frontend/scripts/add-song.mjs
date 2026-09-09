// Dev-time utility: add a song to src/data/songs.ts from the command line.
//
// Works for BOTH setups:
//   - local files  -> pass "/audio/foo.mp3" and "/covers/foo.jpg" (must exist in public/)
//   - external cloud -> pass full "https://..." URLs (e.g. Cloudflare R2, Dropbox)
//                       and nothing gets uploaded into this repo.
//
// Usage:
//   node scripts/add-song.mjs \
//     --id "husn-2" \
//     --title "Husn" \
//     --artist "Anuv Jain" \
//     --library "Bathroom" \
//     --audio "https://pub-xxxx.r2.dev/audio/husn.mp3" \
//     --cover "https://pub-xxxx.r2.dev/covers/husn.jpg" \
//     [--album "Some Album"] [--duration 245]
//
// If --library matches an existing section (e.g. "Qwali") the song is inserted
// into that section; otherwise a new section is created.

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SONGS_PATH = resolve(process.env.SOFTYFY_SONGS_OUT || resolve(ROOT, 'src/data/songs.ts'))

const DEFAULT_LIBRARY = 'Bathroom'

function usage() {
  console.log(`Usage:
  node scripts/add-song.mjs \\
    --id "my-song-id" \\
    --title "Song Title" \\
    --artist "Artist Name" \\
    --library "Bathroom"   (or "Qwali", or a new name) \\
    --audio "https://...mp3" | "/audio/my-song.mp3" \\
    --cover "https://...jpg" | "/covers/my-song.jpg" \\
    [--album "Album Name"] [--duration 245]

  audio/cover can be a full https URL (external hosting — nothing uploaded to
  this repo) OR a local /audio and /covers path (file must already exist).`)
}

function parseArgs(argv) {
  const getValue = (flag) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : undefined
  }
  return {
    id: getValue('--id'),
    title: getValue('--title'),
    artist: getValue('--artist'),
    library: getValue('--library') || DEFAULT_LIBRARY,
    album: getValue('--album') ?? '',
    duration: getValue('--duration'),
    audio: getValue('--audio'),
    cover: getValue('--cover'),
  }
}

/** Escape a value so it is safe inside a single-quoted TS string literal. */
function esc(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function isValidId(id) {
  return /^[a-z0-9][a-z0-9-]*$/i.test(id)
}

function isValidResource(value) {
  return typeof value === 'string' && (value.startsWith('/') || value.startsWith('https://'))
}

function validate(song) {
  const errors = []
  if (!song.id) errors.push('--id is required')
  else if (!isValidId(song.id)) errors.push('--id must be letters/numbers/dashes (kebab-case)')
  if (!song.title) errors.push('--title is required')
  if (!song.artist) errors.push('--artist is required')
  if (!song.library) errors.push('--library is required')
  if (!isValidResource(song.audio)) errors.push('--audio must be a full https URL or a /audio/... path')
  if (!isValidResource(song.cover)) errors.push('--cover must be a full https URL or a /covers/... path')
  if (song.duration !== undefined && (!Number.isFinite(Number(song.duration)) || Number(song.duration) < 0)) {
    errors.push('--duration must be a non-negative number of seconds')
  }
  if (errors.length > 0) {
    console.error('Error:')
    for (const e of errors) console.error(`  - ${e}`)
    console.log('')
    usage()
    process.exit(1)
  }
  return {
    ...song,
    album: song.album ?? '',
    durationSec: Number(song.duration ?? 0),
  }
}

function buildEntry(song) {
  const lines = [
    '  {',
    `    id: '${esc(song.id)}',`,
    `    title: '${esc(song.title)}',`,
    `    artist: '${esc(song.artist)}',`,
    `    album: '${esc(song.album)}',`,
    `    durationSec: ${song.durationSec},`,
    `    audioSrc: '${esc(song.audio)}',`,
    `    coverSrc: '${esc(song.cover)}',`,
    `    library: '${esc(song.library)}',`,
    '  },',
  ]
  return lines.join('\n')
}

function sectionHeader(name) {
  const pad = '─'.repeat(Math.max(4, 76 - name.length - 8))
  return `  // ── ${name} ${pad}`
}

function findSectionBoundaries(lines) {
  // Returns [{ name, headerIndex, lastEntryIndex }] for every section comment.
  const sections = []
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^[ \t]*\/\/[ \t]*─{2} ([^─]+) ─/)
    if (m) sections.push({ name: m[1].trim(), headerIndex: i, lastEntryIndex: null })
  }
  for (let s = 0; s < sections.length; s += 1) {
    const end = s + 1 < sections.length ? sections[s + 1].headerIndex : lines.length - 1
    let last = null
    for (let i = sections[s].headerIndex + 1; i < end; i += 1) {
      if (/^\s*\},$/.test(lines[i])) last = i
    }
    sections[s].lastEntryIndex = last
  }
  return sections
}

async function main() {
  const song = validate(parseArgs(process.argv.slice(2)))
  const src = await readFile(SONGS_PATH, 'utf8')
  const lines = src.split(/\r?\n/)

  const ids = [...src.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1])
  if (ids.includes(song.id)) {
    console.error(`Error: a song with id '${song.id}' already exists in songs.ts`)
    process.exit(1)
  }

  const sections = findSectionBoundaries(lines)
  const section = sections.find((s) => s.name === song.library)
  const entry = buildEntry(song)

  if (section && section.lastEntryIndex !== null) {
    lines.splice(section.lastEntryIndex + 1, 0, entry)
  } else {
    const closingBracketIndex = lines.findIndex((l) => /^\s*\]\s*$/.test(l))
    if (closingBracketIndex === -1) {
      console.error(`Error: could not find the closing "]' of the SONGS array`)
      process.exit(1)
    }
    if (section) {
      lines.splice(closingBracketIndex, 0, entry)
    } else {
      lines.splice(closingBracketIndex, 0, '', sectionHeader(song.library), entry)
    }
  }

  await writeFile(SONGS_PATH, lines.join('\n') + '\n')
  console.log(`Added "${song.title}" — ${song.artist} to library "${song.library}" (id: ${song.id})`)
  console.log(`  audio: ${song.audio}`)
  console.log(`  cover: ${song.cover}`)
  if (song.audio.startsWith('https://')) {
    console.log('  Note: external URL — make sure the file is actually hosted at that address.')
  } else {
    console.log(`  Note: local file — make sure it exists at public${song.audio}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})