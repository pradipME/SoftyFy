/**
 * Resolves the ordered list of URLs to try for a song's audio.
 *
 * Streaming lives on exactly ONE host, Drive's keyless download endpoint:
 *
 *   https://drive.usercontent.google.com/download?id=<FILE_ID>&export=download
 *
 * No API key is involved. The keyed API endpoint
 * (www.googleapis.com/drive/v3/files/<ID>?alt=media&key=<KEY>) was retired
 * after Google's anti-abuse flagging 403'd every key across several projects;
 * the keyless endpoint answers 200 with audio/mpeg + byte ranges + ACAO:*.
 *
 * buildAudioCandidates therefore returns exactly one entry — the song's own URL.
 * Multi-host fallback is deliberately gone: the player retries this single URL
 * with escalating backoff instead of cycling through hosts. Sources that are
 * not Drive streams (local /audio/... files, arbitrary HTTPS) are also returned
 * as their sole candidate.
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