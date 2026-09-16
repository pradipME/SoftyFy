// Dev-time utility: rewrite src/data/songs.ts to point every still-local
// audioSrc/coverSrc at the Google Drive copies already uploaded to
// drive:SoftyFy/audio and drive:SoftyFy/cover.
//
// Usage:
//   node scripts/link-drive-songs.mjs
//
// The audio URLs come from ./drive-url.mjs, which uses a single API key (see
// .env.example). Load your key first so every rewritten entry uses the same
// configured key:
//   node --env-file=.env scripts/link-drive-songs.mjs
//
// Files were uploaded in one bulk `rclone copy` and the parent folders were
// shared ("anyone with the link"), so every file inside is publicly reachable
// — no per-file linking step needed.
//
// Env overrides:  SOFTYFY_SONGS_OUT  (test with a temp copy of songs.ts)

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { audioUrl, coverUrl } from './drive-url.mjs'

const run = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SONGS_PATH = resolve(process.env.SOFTYFY_SONGS_OUT || resolve(ROOT, 'src/data/songs.ts'))

async function findRclone() {
  try {
    await run('where.exe', ['rclone'])
    return 'rclone'
  } catch {
    /* not on PATH */
  }
  const candidates = [
    resolve(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Links/rclone.exe'),
    resolve(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Packages',
      'Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'rclone-v1.75.1-windows-amd64', 'rclone.exe'),
  ]
  for (const c of candidates) if (existsSync(c)) return c
  throw new Error('rclone not found. Install it with: winget install Rclone.Rclone')
}

async function lsjson(rclone, remotePath) {
  const { stdout } = await run(rclone, ['lsjson', remotePath], { env: process.env, maxBuffer: 16 * 1024 * 1024 })
  return JSON.parse(stdout)
}

function basename(p) {
  return p.split('/').pop()
}

async function main() {
  const rc = await findRclone()
  const audioFiles = await lsjson(rc, 'drive:SoftyFy/audio')
  const coverFiles = await lsjson(rc, 'drive:SoftyFy/cover')
  const audioId = Object.fromEntries(audioFiles.filter((f) => !f.IsDir).map((f) => [f.Name, f.ID]))
  const coverId = Object.fromEntries(coverFiles.filter((f) => !f.IsDir).map((f) => [f.Name, f.ID]))

  const src = await readFile(SONGS_PATH, 'utf8')
  let changed = 0
  let missing = []

  const replacer = (line) => {
    // Already-linked Drive API URL → rebuild via audioUrl(fileId) so the key
    // matches the single configured key (see .env.example).
    const audioDrive = line.match(
      /^(\s*audioSrc:\s*)'(https:\/\/www\.googleapis\.com\/drive\/v3\/files\/([A-Za-z0-9_-]+)\?alt=media)[^']*',?\s*$/,
    )
    const audio = line.match(/^(\s*audioSrc:\s*)'(\/audio\/[^']+)',?\s*$/)
    const cover = line.match(/^(\s*coverSrc:\s*)'(\/covers\/[^']+)',?\s*$/)
    if (!audioDrive && !audio && !cover) return line

    if (audioDrive) {
      changed += 1
      return `${audioDrive[1]}'${audioUrl(audioDrive[3])}',`
    }

    const isAudio = Boolean(audio)
    const pairs = isAudio ? [audioId, audio] : [coverId, cover]
    const idMap = pairs[0]
    const [, prefix, local] = pairs[1]
    const name = basename(local)
    const fileId = idMap[name]
    if (!fileId) {
      missing.push(`${isAudio ? 'audio' : 'cover'} ${local}`)
      return line
    }
    const url = isAudio ? audioUrl(fileId) : coverUrl(fileId)
    changed += 1
    return `${prefix}'${url}',`
  }

  const out = src.split(/\r?\n/).map((l) => (l.trim().startsWith("audioSrc:") || l.trim().startsWith("coverSrc:")) ? replacer(l) : l).join('\n')
  await writeFile(SONGS_PATH, out)
  console.log(`Linked ${changed} resource(s) in ${SONGS_PATH}.`)
  if (missing.length) {
    console.log('MISSING on Drive:')
    for (const m of missing) console.log(`  - ${m}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(String(err?.stderr || err?.message || err))
  process.exit(1)
})