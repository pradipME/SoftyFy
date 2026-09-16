/**
 * Resolves the ordered list of URLs to try for a song's audio.
 *
 * Streaming lives on exactly ONE host, the official Drive API media endpoint:
 *
 *   https://www.googleapis.com/drive/v3/files/<FILE_ID>?alt=media&key=<KEY>
 *
 * Every alternative host was probed and rejected in real browsers during the
 * original playback fix (see project report §4.1): `drive.usercontent.google.com`
 * returns HTTP 403 to any cross-site media request, `drive.google.com/uc`
 * redirects 303 → 403, and `lh3.googleusercontent.com/d/<ID>` returns 404. They
 * only appeared to work in curl, because browsers attach `Sec-Fetch-Site:
 * cross-site` to cross-origin media requests and those endpoints reject it.
 *
 * buildAudioCandidates therefore returns exactly one entry — the song's own URL.
 * Multi-host fallback is deliberately gone: the player retries this single URL
 * with escalating backoff instead of cycling through hosts that are known to
 * fail before ever reaching the one that works. Sources that are not Drive
 * streams (local /audio/... files, arbitrary HTTPS) are also returned as their
 * sole candidate.
 */
export function buildAudioCandidates(source: string): string[] {
  return [source]
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