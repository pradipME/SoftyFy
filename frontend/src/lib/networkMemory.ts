/**
 * Session memory of how the network has actually behaved while songs played.
 *
 * `navigator.connection` cannot be trusted for this job. On a phone sitting on
 * a 4G/5G radio with a weak signal it still reports `effectiveType: "4g"` with a
 * healthy `downlink`, so the player kept choosing the high-bitrate file and
 * buffering badly. The two signals that DO reflect reality are both free —
 * they come from media events a song produces anyway:
 *
 *   1. **time-to-buffer** — ms from load start until ~5 s of media sits buffered
 *      ahead, measured by the existing startup buffer guard. No probe downloads,
 *      no extra requests: it is the download already happening for playback.
 *   2. **stalls** — `waiting` / `stalled` transitions during that song.
 *
 * A load that stalls twice, or takes an unreasonably long time to fill its
 * buffer, marks the session as a weak network and pins the next several songs
 * to LQ. Recovery needs several consecutive comfortable loads, so the tier
 * cannot flip-flop between neighbouring songs. Samples are kept in a short
 * rolling window and LQ loads are measured exactly like HQ ones: an LQ load
 * that comfortably fills its buffer is the evidence that there is headroom to
 * upgrade again, which is how the session climbs back to HQ.
 */
import type { QualityTier } from '../context/playerReducer'
import { hasConnectionInfo, logApp, round, slowConnectionReason } from './mediaDebug'

/** Seconds of buffered runway a load must reach before it counts as buffered. */
export const TARGET_BUFFER_S = 5
/** Taking longer than this to fill that runway is treated as a weak network. */
export const SLOW_LOAD_MS = 4_000
/**
 * Filling the runway faster than this is a comfortable load. The LQ files are
 * a fraction of the HQ bitrate, so a load that comfortably fills LQ has real
 * headroom for HQ — that is the measured-throughput upgrade path, and it needs
 * no knowledge of the actual bitrates.
 */
const FAST_LOAD_MS: Record<QualityTier, number> = { hq: 2000, lq: 800 }
/**
 * Loads this fast came out of the cache. They are evidence about neither the
 * network nor the song, so they are ignored instead of counting as "fast".
 */
export const INSTANT_LOAD_MS = 150
/** `waiting`/`stalled` transitions within one song that make it a real stall. */
export const STALL_LIMIT = 2
/** How many recent loads the rolling window keeps. */
export const SAMPLE_WINDOW = 5
/** Consecutive comfortable loads needed to leave the weak-network state. */
export const RECOVER_GOOD_SAMPLES = 3

export interface LoadSample {
  songId: string
  /** The tier this song was actually loaded at. */
  quality: QualityTier
  /** ms from load start until TARGET_BUFFER_S was buffered ahead; null if it never got there. */
  timeToBufferMs: number | null
  /** `waiting`/`stalled` transitions observed while the song played. */
  stalls: number
}

/**
 * `good` proves the network is comfortable, `weak` indicts it, `neutral` says
 * nothing either way (a cache hit, or a load that was neither fast nor dire).
 */
export type SampleVerdict = 'good' | 'weak' | 'neutral'

/** Why a sample counts against the network, or null when it does not. */
export function sampleWeakReason(sample: LoadSample): string | null {
  if (sample.stalls >= STALL_LIMIT) return `stalls:${sample.stalls}`
  if (sample.timeToBufferMs === null) return 'buffer-timeout'
  if (sample.timeToBufferMs >= SLOW_LOAD_MS) return `buffer:${Math.round(sample.timeToBufferMs)}ms`
  return null
}

export function sampleVerdict(sample: LoadSample): SampleVerdict {
  if (sampleWeakReason(sample) !== null) return 'weak'
  // A single stall is below the limit, but a song that stalled at all is not
  // proof the network is comfortable, so it must not advance the recovery count.
  if (sample.stalls > 0) return 'neutral'
  const time = sample.timeToBufferMs
  if (time === null || time < INSTANT_LOAD_MS || time > FAST_LOAD_MS[sample.quality]) return 'neutral'
  return 'good'
}

/** Rolling window of the most recent loads, oldest first. */
const samples: LoadSample[] = []
let weak = false
let goodStreak = 0
let weakTrigger = 'unknown'

/**
 * Folds one finished song load into the session memory. Called when a song is
 * over (or when the next load starts), so the verdict for a slow song is known
 * before the following song has to pick its tier.
 */
export function recordLoadSample(sample: LoadSample): void {
  samples.push(sample)
  if (samples.length > SAMPLE_WINDOW) samples.splice(0, samples.length - SAMPLE_WINDOW)

  const verdict = sampleVerdict(sample)
  const weakReason = sampleWeakReason(sample)
  if (verdict === 'weak') {
    // A bad load is conclusive: pin LQ and restart the recovery count, so a
    // network that keeps dipping can never creep back up one song at a time.
    weak = true
    goodStreak = 0
    weakTrigger = weakReason ?? 'unknown'
  } else if (verdict === 'good') {
    goodStreak += 1
    if (weak && goodStreak >= RECOVER_GOOD_SAMPLES) {
      weak = false
      goodStreak = 0
      weakTrigger = 'unknown'
    }
  }
  // A neutral sample neither proves nor disproves anything, so it deliberately
  // leaves the streak alone: recovering needs RECOVER_GOOD_SAMPLES comfortable
  // loads, which a run of cache hits can neither fake nor block.

  logApp('quality.measure', {
    songId: sample.songId,
    quality: sample.quality,
    timeToBufferMs: sample.timeToBufferMs,
    stalls: sample.stalls,
    verdict,
    weak,
    goodStreak,
  })
}

export interface NetworkMemorySnapshot {
  /** True while the session is pinned to LQ after a bad load. */
  weak: boolean
  /** Consecutive comfortable loads so far (recovery progress). */
  goodStreak: number
  /** How many loads the rolling window currently holds. */
  sampleCount: number
  /** Time-to-buffer of the most recent measured load, null when nothing was measured. */
  timeToBufferMs: number | null
  /** Stalls counted on the most recent measured load. */
  stalls: number
  /** Media seconds buffered per second of wall clock on the last measured load. */
  fillRate: number | null
}

function latest(): LoadSample | null {
  return samples.length > 0 ? samples[samples.length - 1] : null
}

export function networkMemorySnapshot(): NetworkMemorySnapshot {
  const last = latest()
  const time = last?.timeToBufferMs ?? null
  return {
    weak,
    goodStreak,
    sampleCount: samples.length,
    timeToBufferMs: time,
    stalls: last?.stalls ?? 0,
    fillRate: time !== null && time > 0 ? round(TARGET_BUFFER_S / (time / 1000), 2) : null,
  }
}

export interface AutoQualityDecision {
  quality: QualityTier
  /** Machine-readable explanation, logged and used to word the on-screen note. */
  reason: string
}

/**
 * The Auto tier's decision, in the order the signals are trusted:
 *
 *   1. weak-network memory from what actually played (stalls / time-to-buffer),
 *   2. the most recent measured load when it was comfortably fast,
 *   3. `navigator.connection` as a secondary hint,
 *   4. HQ — nothing measurable yet is never treated as slow.
 */
export function autoQualityDecision(): AutoQualityDecision {
  if (weak) {
    return { quality: 'lq', reason: `weak-network:${weakTrigger}` }
  }

  const last = latest()
  if (last !== null && sampleVerdict(last) === 'good') {
    return { quality: 'hq', reason: `measured-fast:${Math.round(last.timeToBufferMs ?? 0)}ms` }
  }

  const hint = slowConnectionReason()
  if (hint !== null) return { quality: 'lq', reason: hint }
  if (hasConnectionInfo()) return { quality: 'hq', reason: 'fast-connection' }
  // No measurement and no Network Information API: unknown is not slow.
  return { quality: 'hq', reason: 'unknown-default-hq' }
}

/** Clears the session memory. Only for tests and full reloads. */
export function resetNetworkMemory(): void {
  samples.length = 0
  weak = false
  goodStreak = 0
  weakTrigger = 'unknown'
}
