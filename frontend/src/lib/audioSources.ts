/**
 * Resolves the ordered list of URLs to try for a song's audio.
 *
 * Audio lives on GitHub Release assets (softyfy-audio-v1):
 *
 *   https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/<FILE>.mp3
 *
 * This replaced Google Drive streaming after both Drive routes died in real
 * browsers: the keyed API (alt=media) was 403'd by Google's key flagging, and
 * Drive's keyless download endpoints reject any request carrying browser
 * `Sec-Fetch-Site: cross-site` headers. GitHub serves release assets with
 * byte ranges (206) cross-site to media elements, no key, no flags.
 *
 * buildAudioCandidates therefore returns exactly one entry — the song's own URL.
 * Multi-host fallback is deliberately gone: the player retries this single URL
 * with escalating backoff instead of cycling through hosts. Sources that are
 * not Release streams (local /audio/... files, arbitrary HTTPS) are also
 * returned as their sole candidate.
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