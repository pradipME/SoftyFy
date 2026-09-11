import type { PersistedPreferences } from '../context/playerReducer'

export interface ResumePosition {
  /** Seconds played into the song when it was last left. */
  time: number
  /** Known duration of the song at that point (0 if unknown). */
  duration: number
  /** Epoch ms of the last update — used for staleness checks. */
  updatedAt: number
}

export type ResumePositions = Record<string, ResumePosition>

const PREFS_KEY = 'softyfy:preferences'
const RESUME_KEY = 'softyfy:resumePositions'
const WORKING_SRC_KEY = 'softyfy:workingSources'

/** Returns localStorage when it is available and usable, otherwise null. */
export function safeStorage(): Storage | null {
  try {
    const storage = window.localStorage
    const probe = '__softyfy_probe__'
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

export function loadPreferences(storage: Storage | null): PersistedPreferences | null {
  if (storage === null) return null
  try {
    const raw = storage.getItem(PREFS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedPreferences>
    if (typeof parsed !== 'object' || parsed === null) return null
    return {
      volume: typeof parsed.volume === 'number' ? parsed.volume : undefined,
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : undefined,
      repeat: parsed.repeat ?? undefined,
      shuffle: typeof parsed.shuffle === 'boolean' ? parsed.shuffle : undefined,
    }
  } catch {
    return null
  }
}

export function savePreferences(
  preferences: PersistedPreferences,
  storage: Storage | null,
): void {
  if (storage === null) return
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(preferences))
  } catch {
    // Ignore write failures (private browsing, quota, etc.)
  }
}

export function loadResumePositions(storage: Storage | null): ResumePositions {
  if (storage === null) return {}
  try {
    const raw = storage.getItem(RESUME_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed !== 'object' || parsed === null) return {}
    const result: ResumePositions = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value !== 'object' || value === null) continue
      const entry = value as Partial<ResumePosition>
      const time = entry.time
      if (typeof time !== 'number' || !Number.isFinite(time)) continue
      result[id] = {
        time,
        duration: Number.isFinite(entry.duration) ? (entry.duration as number) : 0,
        updatedAt: Number.isFinite(entry.updatedAt) ? (entry.updatedAt as number) : 0,
      }
    }
    return result
  } catch {
    return {}
  }
}

export function saveResumePosition(
  storage: Storage | null,
  positions: ResumePositions,
): void {
  if (storage === null) return
  try {
    storage.setItem(RESUME_KEY, JSON.stringify(positions))
  } catch {
    // Ignore write failures (private browsing, quota, etc.)
  }
}

export function removeResumePosition(
  storage: Storage | null,
  positions: ResumePositions,
  id: string,
): ResumePositions {
  if (!(id in positions)) return positions
  const next = { ...positions }
  delete next[id]
  saveResumePosition(storage, next)
  return next
}

/**
 * Songs that stream from flaky external hosts remember the exact URL that
 * actually played, so the next session starts there instead of retrying hosts
 * that failed before. Keyed by song id; stores the winning audio URL.
 */
export function loadWorkingSources(storage: Storage | null): Record<string, string> {
  if (storage === null) return {}
  try {
    const raw = storage.getItem(WORKING_SRC_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed !== 'object' || parsed === null) return {}
    const result: Record<string, string> = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.length > 0) result[id] = value
    }
    return result
  } catch {
    return {}
  }
}

export function saveWorkingSource(storage: Storage | null, sources: Record<string, string>): void {
  if (storage === null) return
  try {
    storage.setItem(WORKING_SRC_KEY, JSON.stringify(sources))
  } catch {
    // Ignore write failures (private browsing, quota, etc.)
  }
}
