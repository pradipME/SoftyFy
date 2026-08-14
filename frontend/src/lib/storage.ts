import type { PersistedPreferences } from '../context/playerReducer'

const PREFS_KEY = 'softyfy:preferences'

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
