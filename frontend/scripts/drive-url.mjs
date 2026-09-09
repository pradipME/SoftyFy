// Shared Google Drive URL helpers.
//
// Audio streams through the Drive API (alt=media) because the plain Drive
// "usercontent" download endpoint returns HTTP 403 to any cross-site browser
// media request. The API key below is a public, key-restricted key — it is
// also embedded in the built PWA (songs.ts), so it ships to the browser anyway.
//
// Env override: SOFTYFY_DRIVE_API_KEY

export const DRIVE_API_KEY =
  process.env.SOFTYFY_DRIVE_API_KEY || 'AIzaSyAxAkYvJVFy_5HXwvejOlMi0yno613rtK8'

const FILES_BASE = 'https://www.googleapis.com/drive/v3/files'
const THUMBNAIL_BASE = 'https://drive.google.com/thumbnail'

export function audioUrl(fileId) {
  return `${FILES_BASE}/${encodeURIComponent(fileId)}?alt=media&key=${DRIVE_API_KEY}`
}

export function coverUrl(fileId) {
  return `${THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`
}