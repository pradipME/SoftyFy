/**
 * Resolves the ordered list of downloadable URLs to try for a song's audio.
 *
 * Songs streamed from Google Drive are tried host-by-host so the player can
 * fall back when one host drops or is throttled:
 *
 *   1. Google's direct-download host used by the Drive web UI (
 *      `drive.usercontent.google.com`) — keyless, real byte-range support,
 *   2. the classic `drive.google.com/uc` public link — keyless,
 *   3. the Drive API media URL (`www.googleapis.com/drive/v3/files/...?alt=media`)
 *      as a last resort; that endpoint is throttled for public hotlinking and
 *      needs a Google Cloud API key, so playback never depends on it.
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
  const apiUrl = match[0]
  const userContentUrl =
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`
  const publicLinkUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`
  return [userContentUrl, publicLinkUrl, apiUrl]
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