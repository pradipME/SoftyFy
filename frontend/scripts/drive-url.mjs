// Shared Google Drive URL helpers.
//
// Audio streams KEYLESS from Drive's public download endpoint
// (drive.usercontent.google.com/download?id=…&export=download). No API key is
// involved anywhere: every keyed request to www.googleapis.com alt=media was
// answered 403 by Google's anti-abuse flagging — across FOUR different API
// keys and multiple projects — while the keyless download endpoint keeps
// answering 200 with audio/mpeg, byte ranges and ACAO:* (verified direct).
//
// The Drive API key era is over. The keys below are kept purely as a historical
// record — there is NO live code that uses any of them:
//
//   AIzaSyDJQOBTOSYvirZGDLjDOSEssJHx5e_BXDk       (retired — manual fallback)
//   AIzaSyD0q-Vxl3jNY1VOjJ6Z2AkWvMwL2QW4oIo      (retired — manual fallback)
//   AIzaSyAxAkYvJVFy_5HXwvejOlMi0yno613rtK8      (flagged by Google — retired)
//   AIzaSyClaVWOBuBRg9mu7IPJqj601RbXfGjXaU0      (flagged by Google — retired)
//   AIzaSyDiCMArpkdOItpvTleR4ahYHpEwMAfMRcI      (flagged by Google — retired)

const DRIVE_DOWNLOAD_BASE = 'https://drive.usercontent.google.com/download'
const THUMBNAIL_BASE = 'https://drive.google.com/thumbnail'

export function audioUrl(fileId) {
  return `${DRIVE_DOWNLOAD_BASE}?id=${encodeURIComponent(fileId)}&export=download`
}

export function coverUrl(fileId) {
  return `${THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`
}