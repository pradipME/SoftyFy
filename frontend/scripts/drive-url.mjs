// Shared Google Drive URL helpers.
//
// Audio streams through the Drive API (alt=media) because the plain Drive
// "usercontent" download endpoint returns HTTP 403 to any cross-site browser
// media request. The API key below is a public, key-restricted key — it is
// also embedded in the built PWA (songs.ts), so it ships to the browser anyway.
//
// A SINGLE API key is used for every stream URL. Key rotation was removed: for
// a personal library a single key's per-day download quota is far above real
// usage, and multi-key rotation only made failures harder to isolate during the
// buffering investigation. The SW backup-key safety net was also removed after
// Google's anti-abuse system flagged the previous primary — keeping a dead
// second key only added a wasted failing request to every blocked song.
// Retired keys are kept below purely as a manual fallback in case the daily
// quota is ever hit — there is NO live rotation code anywhere anymore:
//
//   AIzaSyDJQOBTOSYvirZGDLjDOSEssJHx5e_BXDk       (retired — manual fallback)
//   AIzaSyD0q-Vxl3jNY1VOjJ6Z2AkWvMwL2QW4oIo      (retired — manual fallback)
//   AIzaSyAxAkYvJVFy_5HXwvejOlMi0yno613rtK8      (flagged by Google — retired)
//   AIzaSyClaVWOBuBRg9mu7IPJqj601RbXfGjXaU0      (flagged by Google — retired)
//
// The key is read from the environment first, otherwise the built-in default is
// used:
//
//   SOFTYFY_DRIVE_API_KEY  (scripts; load via --env-file=.env)
//   VITE_DRIVE_API_KEY     (build-time env, honored for parity)

const DEFAULT_API_KEY = 'AIzaSyDiCMArpkdOItpvTleR4ahYHpEwMAfMRcI'

export const DRIVE_API_KEY =
  process.env.SOFTYFY_DRIVE_API_KEY || process.env.VITE_DRIVE_API_KEY || DEFAULT_API_KEY

const FILES_BASE = 'https://www.googleapis.com/drive/v3/files'
const THUMBNAIL_BASE = 'https://drive.google.com/thumbnail'

export function audioUrl(fileId) {
  return `${FILES_BASE}/${encodeURIComponent(fileId)}?alt=media&key=${DRIVE_API_KEY}`
}

export function coverUrl(fileId) {
  return `${THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`
}