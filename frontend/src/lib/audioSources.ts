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
import type { QualityTier, StreamingQuality } from '../context/playerReducer'
import type { Song } from '../types/song'
import { connectionSummary, logApp } from './mediaDebug'
import { autoQualityDecision, networkMemorySnapshot } from './networkMemory'

/** Prefix marking a reason that came from the user's setting, not the network. */
const MANUAL_REASON_PREFIX = 'manual:'

/** True when the manual "Streaming quality" setting decided this tier. */
export function isManualQualityReason(reason: string): boolean {
  return reason.startsWith(MANUAL_REASON_PREFIX)
}

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

export interface QualityChoice {
  /** The URL audio should load from for this song, decided NOW. */
  src: string
  /** Which quality tier was picked. */
  quality: QualityTier
  /** Human-readable explanation (no LQ version, connection type, etc.). */
  reason: string
}

/**
 * Chooses which URL to play for a song — HQ or its low-bitrate twin — at load
 * time only.
 *
 * The decision runs ONCE when a song starts loading (and again for the
 * preloaded "next" song), never mid-playback, so changing network conditions
 * cannot swap buffers under an active stream and glitch the audio. A song with
 * no `audioSrcLQ` falls back to `audioSrc` exactly as before LQ existed — that
 * check comes first because HQ is then the only URL there is, whatever the
 * setting says.
 *
 * Signals are weighted by how much they can actually be trusted:
 *
 *   1. the manual "Streaming quality" setting — the user outranks every guess,
 *   2. measured reality from the session (stalls, time-to-buffer) — see
 *      {@link networkMemory}; `navigator.connection` cannot see a weak mobile
 *      signal, so this is what actually fixed the bad buffering,
 *   3. `navigator.connection` as a secondary hint for before anything has been
 *      measured,
 *   4. HQ, because "not measurable yet" is not evidence of a slow network.
 */
export function pickAudioSource(song: Song, preference: StreamingQuality = 'auto'): QualityChoice {
  const lq = song.audioSrcLQ
  const decision =
    lq === undefined
      ? { quality: 'hq' as QualityTier, reason: 'no-lq-version' }
      : decideQuality(preference)
  const src = decision.quality === 'lq' ? (lq as string) : song.audioSrc
  logDecision(song, decision.quality, decision.reason, preference)
  return { src, quality: decision.quality, reason: decision.reason }
}

function decideQuality(preference: StreamingQuality): { quality: QualityTier; reason: string } {
  if (preference === 'high') return { quality: 'hq', reason: `${MANUAL_REASON_PREFIX}high` }
  if (preference === 'low') return { quality: 'lq', reason: `${MANUAL_REASON_PREFIX}low` }
  return autoQualityDecision()
}

/**
 * Records the decision and everything that justified it in the media debug
 * ring buffer (?debug=1 → DebugOverlay), including the measured time-to-buffer
 * and stall count behind an automatic downgrade.
 */
function logDecision(
  song: Song,
  quality: QualityTier,
  reason: string,
  preference: StreamingQuality,
): void {
  const memory = networkMemorySnapshot()
  logApp('quality.decide', {
    songId: song.id,
    quality,
    reason,
    preference,
    timeToBufferMs: memory.timeToBufferMs,
    stalls: memory.stalls,
    fillRate: memory.fillRate,
    weak: memory.weak,
    goodStreak: memory.goodStreak,
    sampleCount: memory.sampleCount,
    ...connectionSummary(),
  })
}
