import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  safeStorage,
  sanitizePreferences,
  savePreferences,
  STORAGE_KEY,
  type PersistedPreferences,
} from './persistence'

class MemoryStorage {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  get length(): number {
    return this.data.size
  }
}

describe('sanitizePreferences', () => {
  it('defaults on garbage input', () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences('nope')).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences(42)).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences({})).toEqual(DEFAULT_PREFERENCES)
  })

  it('clamps out-of-range values and rejects unknown repeat modes', () => {
    const prefs = sanitizePreferences({
      volume: 7,
      isMuted: 'yes',
      repeatMode: 'all-the-time',
      shuffleEnabled: 1,
    })
    expect(prefs.volume).toBe(1)
    expect(prefs.isMuted).toBe(false)
    expect(prefs.repeatMode).toBe('off')
    expect(prefs.shuffleEnabled).toBe(false)
  })

  it('accepts valid values', () => {
    const prefs = sanitizePreferences({
      volume: 0.42,
      isMuted: true,
      repeatMode: 'one',
      shuffleEnabled: true,
    })
    expect(prefs).toEqual({ volume: 0.42, isMuted: true, repeatMode: 'one', shuffleEnabled: true })
  })
})

describe('loadPreferences / savePreferences', () => {
  it('round-trips through storage', () => {
    const storage = new MemoryStorage()
    const prefs: PersistedPreferences = {
      volume: 0.6,
      isMuted: true,
      repeatMode: 'all',
      shuffleEnabled: true,
    }
    savePreferences(prefs, storage)
    expect(loadPreferences(storage)).toEqual(prefs)
  })

  it('returns defaults when storage is empty or unavailable', () => {
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(loadPreferences(new MemoryStorage())).toEqual(DEFAULT_PREFERENCES)
  })

  it('falls back to defaults on corrupt data', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{{not json')
    expect(loadPreferences(storage)).toEqual(DEFAULT_PREFERENCES)
  })

  it('never throws when saving fails', () => {
    const failing = {
      setItem: () => {
        throw new Error('quota exceeded')
      },
    } as unknown as Storage
    expect(() => savePreferences(DEFAULT_PREFERENCES, failing)).not.toThrow()
  })
})

describe('safeStorage', () => {
  it('returns null when localStorage is unavailable', () => {
    expect(safeStorage()).toBeNull()
  })
})
