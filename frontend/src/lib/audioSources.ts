/**
 * Resolves the ordered list of downloadable URLs to try for a song's audio.
 *
 * Songs streamed from Google Drive (`www.googleapis.com/drive/v3/files/...?alt=media`)
 * are served by a host that can drop long connections. Each Drive URL therefore
 * expands into two extra public hosts so the player can fall back when one host
 * fails mid-stream:
 *
 *   1. the original Drive API media URL,
 *   2. Google's direct-download host used by the Drive web UI,
 *   3. the classic `drive.google.com/uc` public link.
 *
 * Any other source (local `/audio/...` files, arbitrary HTTPS) is returned
 * untouched — only the player retries it verbatim.
 */

const DRIVE_API_RE =
  /^https:\/\/www\.googleapis\.com\/drive\/v3\/files\/([A-Za-z0-9_-]+)\?alt=media(.+)?$/

export function buildAudioCandidates(source: string): string[] {
  const match = DRIVE_API_RE.exec(source)
  if (match === null) return [source]
  const [, fileId] = match
  const keyPart = match[2] ?? ''
  const apiUrl = match[0]
  const userContentUrl =
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download${keyPart}`
  const publicLinkUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`
  return [apiUrl, userContentUrl, publicLinkUrl]
}

/**
 * Returns the candidate list with a previously-working URL moved to the front,
 * so repeat plays skip hosts that failed before. Unknown sources keep their
 * original order.
 */
export function preferKnownGood(candidates: string[], knownGood?: string): string[] {
  if (knownGood === undefined) return candidates
  if (candidates.length <= 1 || !candidates.includes(knownGood)) return candidates
  return [knownGood, ...candidates.filter((candidate) => candidate !== knownGood)]
}