// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { loadWorkingSources, saveWorkingSource } from './storage'

describe('working audio sources', () => {
  it('round-trips the known-good URL map', () => {
    const storage = window.localStorage
    saveWorkingSource(storage, { afsos: 'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Afsos.mp3' })
    expect(loadWorkingSources(storage).afsos).toBe(
      'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/Afsos.mp3',
    )
  })

  it('returns an empty map when nothing is stored', () => {
    window.localStorage.clear()
    expect(loadWorkingSources(window.localStorage)).toEqual({})
  })

  it('ignores corrupt entries', () => {
    const storage = window.localStorage
    storage.setItem('softyfy:workingSources', '{"bad": 42, "ok": "https://x/y.mp3"}')
    expect(loadWorkingSources(storage)).toEqual({ ok: 'https://x/y.mp3' })
  })
})