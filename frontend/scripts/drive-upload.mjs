// Dev-time utility: upload a local file to Google Drive (via rclone), make it
// public ("anyone with the link") and print the app-ready URLs.
//
// Google Drive usage (instead of the GitHub-hosted /audio+Drift covers):
//   rclone creates a folder  drive:SoftyFy/<kind>/<filename>  and shares it.
//   The returned URLS are used directly as a song's audioSrc / coverSrc —
//   nothing is stored in this repo.
//
// Usage:
//   node scripts/drive-upload.mjs --file "path/to/song.mp3" --kind audio
//   node scripts/drive-upload.mjs --file "path/to/cover.jpg" --kind cover
//
// Output (one per line, for easy scripting):
//   DRIVE_ID      <file id>
//   AUDIO_URL     https://drive.usercontent.google.com/download?id=...&export=download
//   COVER_URL     https://drive.google.com/thumbnail?id=...&sz=w1000

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const USERCONTENT_BASE = 'https://drive.usercontent.google.com/download'
const THUMBNAIL_BASE = 'https://drive.google.com/thumbnail'

async function findRclone() {
  try {
    await run('where.exe', ['rclone'])
    return 'rclone'
  } catch {
    /* not on PATH — fall back to known install locations */
  }
  const candidates = [
    resolve(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Links/rclone.exe'),
    resolve(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Packages',
      'Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'rclone-v1.75.1-windows-amd64', 'rclone.exe'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  throw new Error('rclone not found. Install it with: winget install Rclone.Rclone')
}

const DRIVE_ROOT = 'drive:SoftyFy'

function usage() {
  console.log(`Usage:
  node scripts/drive-upload.mjs --file <local-path> --kind audio|cover
  → uploads to ${DRIVE_ROOT}/<kind>/ and prints the public URLS`)
}

function parseArgs(argv) {
  const getValue = (flag) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : undefined
  }
  return { file: getValue('--file'), kind: getValue('--kind') }
}

function extractFileId(linkUrl) {
  const m = String(linkUrl).match(/(?:file\/d\/|open\?id=)([^&/?#]+)/)
  if (!m) throw new Error(`Could not extract a Drive file id from: ${linkUrl}`)
  return m[1]
}

async function main() {
  const RCLONE = await findRclone()
  const { file, kind } = parseArgs(process.argv.slice(2))
  if (!file) {
    console.error('Error: --file is required')
    usage()
    process.exit(1)
  }
  if (kind !== 'audio' && kind !== 'cover') {
    console.error('Error: --kind must be "audio" or "cover"')
    usage()
    process.exit(1)
  }

  const localPath = resolve(ROOT, file)
  const remoteDir = `${DRIVE_ROOT}/${kind}/`
  const remote = `${remoteDir}${basename(localPath)}`

  console.error(`Uploading ${localPath} → ${remoteDir} ...`)
  await run(RCLONE, ['copy', localPath, remoteDir], { env: process.env })

  console.error('Creating public link ...')
  const { stdout } = await run(RCLONE, ['link', remote], { env: process.env })
  const url = String(stdout).trim()
  const fileId = extractFileId(url)
  const audioUrl = `${USERCONTENT_BASE}?id=${encodeURIComponent(fileId)}&export=download`
  const coverUrl = `${THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`

  console.log(`DRIVE_ID\t${fileId}`)
  console.log(`AUDIO_URL\t${audioUrl}`)
  console.log(`COVER_URL\t${coverUrl}`)
}

main().catch((err) => {
  console.error(String(err?.stderr || err?.message || err))
  process.exit(1)
})