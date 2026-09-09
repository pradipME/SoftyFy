// Dev-time utility: upload every song/cover that still lives in public/ to
// Google Drive (via scripts/drive-upload.mjs) and rewrite src/data/songs.ts
// so all audioSrc/coverSrc point at the public Drive URLs.
//
// Usage:
//   node scripts/migrate-to-drive.mjs
//
// After a successful run you can delete the local files, e.g.:
//   Remove-Item public/audio/*.mp3, public/covers/*.jpg
//
// Env overrides:  SOFTYFY_SONGS_OUT  (test with a temp copy of songs.ts)

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SONGS_PATH = resolve(process.env.SOFTYFY_SONGS_OUT || resolve(ROOT, 'src/data/songs.ts'))
const DRIVE_SCRIPT = resolve(__dirname, 'drive-upload.mjs')

async function upload(localRelativePath, kind) {
  // localRelativePath starts with "/audio/..." or "/covers/..." from songs.ts
  const file = `public${localRelativePath}` // e.g. public/audio/Afsos (…).mp3
  const { stdout } = await run('node', [DRIVE_SCRIPT, '--file', file, '--kind', kind], {
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  })
  const line = stdout.split(/\r?\n/).find((l) =>
    kind === 'audio' ? l.startsWith('AUDIO_URL') : l.startsWith('COVER_URL'))
  const url = line?.split('\t')[1]
  if (!url) throw new Error(`No ${kind.toUpperCase()}_URL returned for ${localRelativePath}:\n${stdout}`)
  return url
}

async function main() {
  const src = await readFile(SONGS_PATH, 'utf8')
  const lines = src.split(/\r?\n/)
  const replacements = []
  let currentId = '?'
  let changed = 0
  let failed = 0

  for (let i = 0; i < lines.length; i += 1) {
    const idMatch = lines[i].match(/^\s*id:\s*'([^']+)',?\s*$/)
    if (idMatch) currentId = idMatch[1]

    const audio = lines[i].match(/^\s*audioSrc:\s*'(\/audio\/[^']+)',?\s*$/)
    const cover = lines[i].match(/^\s*coverSrc:\s*'(\/covers\/[^']+)',?\s*$/)
    if (!audio && !cover) continue

    const [kind, local] = audio ? ['audio', audio[1]] : ['cover', cover[1]]
    try {
      process.stderr.write(`[${currentId}] ${kind}: ${local} ... `)
      const url = await upload(local, kind)
      process.stderr.write(`OK -> url ${url.length} chars\n`)
      replacements.push([local, url])
      changed += 1
    } catch (err) {
      process.stderr.write(`FAILED: ${String(err?.stderr || err?.message || err)}\n`)
      failed += 1
    }
  }

  let out = src
  for (const [oldPath, newUrl] of replacements) {
    out = out.split(`'${oldPath}'`).join(`'${newUrl}'`)
  }
  if (changed > 0) await writeFile(SONGS_PATH, out)

  console.log(`\nDone. ${changed} uploads replaced in ${SONGS_PATH}${failed ? `, ${failed} FAILED` : ''}.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(String(err?.stderr || err?.message || err))
  process.exit(1)
})