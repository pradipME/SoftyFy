import type { RepeatMode } from './types'

export interface PersistedPreferences {
  volume: number
  isMuted: boolean
  repeatMode: RepeatMode
  shuffleEnabled: boolean
}

export const STORAGE_KEY = 'softyfy:player'

export const DEFAULT_PREFERENCES: PersistedPreferences = {
  volume: 0.8,
  isMuted: false,
  repeatMode: 'off',
  shuffleEnabled: false,
}

const REPEAT_MODES: RepeatMode[] = ['off', 'all', 'one']

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function sanitizePreferences(raw: unknown): PersistedPreferences {
  const source = (raw !== null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const volume =
    typeof source.volume === 'number' && Number.isFinite(source.volume)
      ? clamp01(source.volume)
      : DEFAULT_PREFERENCES.volume
  const isMuted =
    typeof source.isMuted === 'boolean' ? source.isMuted : DEFAULT_PREFERENCES.isMuted
  const repeatMode = REPEAT_MODES.includes(source.repeatMode as RepeatMode)
    ? (source.repeatMode as RepeatMode)
    : DEFAULT_PREFERENCES.repeatMode
  const shuffleEnabled =
    typeof source.shuffleEnabled === 'boolean' ? source.shuffleEnabled : DEFAULT_PREFERENCES.shuffleEnabled
  return { volume, isMuted, repeatMode, shuffleEnabled }
}

export function loadPreferences(storage: Storage | null): PersistedPreferences {
  if (!storage) return DEFAULT_PREFERENCES
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return sanitizePreferences(JSON.parse(raw) as unknown)
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(preferences: PersistedPreferences, storage: Storage | null): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage unavailable (private mode, quota) — playback must still work.
  }
}

export function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}
