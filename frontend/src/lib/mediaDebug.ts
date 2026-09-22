/**
 * Diagnostic helpers for the "some songs buffer intermittently on mobile"
 * investigation. Everything here is INERT unless the debug flag is on (URL
 * `?debug` or localStorage `softyfy-debug`), and nothing logs to the console —
 * events land in in-memory ring buffers that the DebugOverlay can dump as
 * JSON for manual inspection.
 */
export const DEBUG_FLAG_PARAM = 'debug'
export const DEBUG_FLAG_KEY = 'softyfy-debug'
export const DEBUG_MAX_ENTRIES = 400

export interface MediaLogEntry {
  seq: number
  t: number
  tag: string
  data: Record<string, unknown>
}

let seqCounter = 0

export function appendLogEntry(
  entries: MediaLogEntry[],
  tag: string,
  data: Record<string, unknown> = {},
): MediaLogEntry {
  const entry: MediaLogEntry = { seq: ++seqCounter, t: Date.now(), tag, data }
  entries.push(entry)
  if (entries.length > DEBUG_MAX_ENTRIES) {
    entries.splice(0, entries.length - DEBUG_MAX_ENTRIES)
  }
  return entry
}

/** Ring buffer of app-side events (media element, warm-preload decisions). */
export const appLogRing: MediaLogEntry[] = []

export function logApp(tag: string, data: Record<string, unknown> = {}): void {
  appendLogEntry(appLogRing, tag, data)
}

export function debugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const hasParam = new URLSearchParams(window.location.search).has(DEBUG_FLAG_PARAM)
  try {
    return hasParam || window.localStorage.getItem(DEBUG_FLAG_KEY) === '1'
  } catch {
    return hasParam
  }
}

export function setDebugEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (enabled) {
      window.localStorage.setItem(DEBUG_FLAG_KEY, '1')
    } else {
      window.localStorage.removeItem(DEBUG_FLAG_KEY)
    }
  } catch {
    // Private mode / storage blocked — the URL param still works.
  }
}

type NetworkInformation = {
  effectiveType?: string
  rtt?: number
  downlink?: number
  saveData?: boolean
}

function connectionInfo(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as Navigator & { connection?: NetworkInformation }).connection
}

export function isSlowConnection(): boolean {
  return slowConnectionReason() !== null
}

/**
 * Returns a short reason string when the connection is considered slow, or
 * `null` when it is not. Single source of truth for the slow-connection
 * decision so the warm-preload timing, the LQ-quality pick, and debugging logs
 * can never disagree on the definition.
 *
 * Slow = Data Saver on, effectiveType 2g/3g (or slower), RTT above 400 ms, or
 * an estimated downlink below 0.5 Mb/s. Returns the FIRST matching reason.
 */
export function slowConnectionReason(): string | null {
  const conn = connectionInfo()
  if (!conn) return null
  if (conn.saveData) return 'saveData'
  const effectiveType = conn.effectiveType
  if (effectiveType !== undefined && ['slow-2g', '2g', '3g'].includes(effectiveType)) {
    return `effectiveType:${effectiveType}`
  }
  const rtt = conn.rtt ?? 0
  if (rtt > 400) return `rtt:${rtt}ms`
  const downlink = conn.downlink
  if (downlink !== undefined && downlink < 0.5) return `downlink:${downlink}Mb/s`
  return null
}

export function connectionSummary(): Record<string, unknown> {
  const conn = connectionInfo()
  if (!conn) return { effectiveType: 'unknown' }
  return {
    effectiveType: conn.effectiveType ?? 'unknown',
    rtt: conn.rtt ?? null,
    downlink: conn.downlink ?? null,
    saveData: conn.saveData ?? false,
  }
}

/** Seconds of buffered media strictly AHEAD of `time` (0 if none, Infinity if unmeasurable). */
export function bufferedAheadOf(audio: HTMLAudioElement, time: number): number {
  try {
    const buffered = audio.buffered
    const len = buffered.length
    if (len === 0) return 0
    const last = buffered.end(len - 1)
    if (time <= last) {
      for (let i = 0; i < len; i++) {
        if (time >= buffered.start(i) && time <= buffered.end(i)) {
          return buffered.end(i) - time
        }
      }
    }
    return Math.max(0, last - time)
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

/**
 * Like `bufferedAheadOf` but returns `null` when the buffer cannot be measured
 * at all (no ranges yet, or the API is unavailable). Used by the startup buffer
 * guard so it only ever gates when there is REAL evidence that the media being
 * played has too little runway — never on "cannot measure" (jsdom, exotic
 * builds), where gating would regress instant-start behavior.
 */
export function bufferedMeasurableAhead(audio: HTMLAudioElement, time: number): number | null {
  try {
    const buffered = audio.buffered
    const len = buffered.length
    if (len === 0) return null
    const last = buffered.end(len - 1)
    if (time <= last) {
      for (let i = 0; i < len; i++) {
        if (time >= buffered.start(i) && time <= buffered.end(i)) {
          return buffered.end(i) - time
        }
      }
    }
    return Math.max(0, last - time)
  } catch {
    return null
  }
}

/** Compact "start-end, start-end" summary of the element's buffered ranges. */
export function bufferedRangesText(audio: HTMLAudioElement): string {
  try {
    const ranges: string[] = []
    for (let i = 0; i < audio.buffered.length; i++) {
      ranges.push(`${Math.round(audio.buffered.start(i))}-${Math.round(audio.buffered.end(i))}`)
    }
    return ranges.join(', ') || 'none'
  } catch {
    return 'n/a'
  }
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}