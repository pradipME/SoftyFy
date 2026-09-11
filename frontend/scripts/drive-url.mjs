// Shared Google Drive URL helpers.
//
// Audio streams through the Drive API (alt=media) because the plain Drive
// "usercontent" download endpoint returns HTTP 403 to any cross-site browser
// media request. The API keys below are public, key-restricted keys — they are
// also embedded in the built PWA (songs.ts), so they ship to the browser anyway.
//
// Multiple keys are rotated round-robin across stream URLs so no single key's
// download quota is exhausted. Keys are read from the environment first:
//
//   SOFTYFY_DRIVE_API_KEY_1..3   (scripts)  →  VITE_DRIVE_API_KEY_1..3
//
// Run any script that rewrites songs.ts with your keys loaded, e.g.:
//   node --env-file=.env scripts/link-drive-songs.mjs
//
// Legacy overrides still work: SOFTYFY_DRIVE_API_KEY (singular) is honored when
// no numbered keys are set. With no env key at all, the built-in default below
// is used as a single key — exactly the previous behavior.

const DEFAULT_API_KEY = 'AIzaSyAxAkYvJVFy_5HXwvejOlMi0yno613rtK8'

function readKeys() {
  const keys = []
  for (let i = 1; i <= 3; i += 1) {
    const key =
      process.env[`SOFTYFY_DRIVE_API_KEY_${i}`] || process.env[`VITE_DRIVE_API_KEY_${i}`]
    if (key) keys.push(key)
  }
  if (keys.length > 0) return [...new Set(keys)]
  const legacy = process.env.SOFTYFY_DRIVE_API_KEY
  if (legacy) return [legacy]
  return [DEFAULT_API_KEY]
}

export const DRIVE_API_KEYS = readKeys()

// Backwards-compatible single-key export — first configured key.
export const DRIVE_API_KEY = DRIVE_API_KEYS[0]

const FILES_BASE = 'https://www.googleapis.com/drive/v3/files'
const THUMBNAIL_BASE = 'https://drive.google.com/thumbnail'

let rotateIndex = 0

/** Returns the next API key in round-robin order (cycles 1 → 2 → … → n → 1). */
export function nextDriveApiKey() {
  const key = DRIVE_API_KEYS[rotateIndex % DRIVE_API_KEYS.length]
  rotateIndex += 1
  return key
}

export function audioUrl(fileId) {
  return `${FILES_BASE}/${encodeURIComponent(fileId)}?alt=media&key=${nextDriveApiKey()}`
}

export function coverUrl(fileId) {
  return `${THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`
}