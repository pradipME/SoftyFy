// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import { buildAudioCandidates, pickAudioSource, preferKnownGood } from './audioSources'

const RELEASE_URL =
  'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/A-B_C.mp3'
const LQ_URL = RELEASE_URL.replace(/\.mp3$/, '-lq.mp3')

describe('buildAudioCandidates', () => {
  it('returns only the original source for local or unknown URLs', () => {
    expect(buildAudioCandidates('/audio/track-01.mp3')).toEqual(['/audio/track-01.mp3'])
    expect(buildAudioCandidates('https://cdn.example.com/a.mp3')).toEqual([
      'https://cdn.example.com/a.mp3',
    ])
  })

  it('returns only the GitHub Release URL for songs — no fallback hosts', () => {
    expect(buildAudioCandidates(RELEASE_URL)).toEqual([RELEASE_URL])
  })

  it('ignores non-release URL patterns', () => {
    expect(
      buildAudioCandidates('https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/A-B_C'),
    ).toEqual(['https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/A-B_C'])
  })
})

describe('preferKnownGood', () => {
  it('moves a known-good URL to the front', () => {
    const candidates = ['a', 'b', 'c']
    expect(preferKnownGood(candidates, 'c')).toEqual(['c', 'a', 'b'])
  })

  it('keeps order when there is no known-good URL', () => {
    const candidates = ['a', 'b', 'c']
    expect(preferKnownGood(candidates)).toEqual(candidates)
  })

  it('keeps single-entry lists untouched', () => {
    const candidates = ['/audio/track-01.mp3']
    expect(preferKnownGood(candidates, '/other.mp3')).toEqual(candidates)
  })
})

function song(withLq: boolean): Song {
  return {
    id: 'x',
    title: 'X',
    artist: 'A',
    album: 'Album',
    durationSec: 180,
    audioSrc: RELEASE_URL,
    coverSrc: '/covers/x.jpg',
    library: 'Test',
    ...(withLq ? { audioSrcLQ: LQ_URL } : {}),
  }
}

/** Stubs the Chromium Network Information API; `undefined` removes it. */
function setConnection(conn: Record<string, unknown> | undefined) {
  if (conn === undefined) {
    delete (navigator as { connection?: unknown }).connection
  } else {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: conn })
  }
}

afterEach(() => setConnection(undefined))

describe('pickAudioSource', () => {
  it('uses HQ when the song has no LQ version at all', () => {
    const choice = pickAudioSource(song(false))
    expect(choice).toEqual({ src: RELEASE_URL, quality: 'hq', reason: 'no-lq-version' })
    expect(buildAudioCandidates(choice.src)).toEqual([RELEASE_URL])
  })

  it('uses HQ on a fast connection', () => {
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false })
    expect(pickAudioSource(song(true))).toEqual({
      src: RELEASE_URL,
      quality: 'hq',
      reason: 'fast-connection',
    })
  })

  it('keeps HQ when the Network Information API is unavailable', () => {
    expect(pickAudioSource(song(true)).quality).toBe('hq')
  })

  it('prefers LQ when effectiveType is 3g', () => {
    setConnection({ effectiveType: '3g', rtt: 300, downlink: 0.7, saveData: false })
    const choice = pickAudioSource(song(true))
    expect(choice).toEqual({ src: LQ_URL, quality: 'lq', reason: 'effectiveType:3g' })
  })

  it('prefers LQ when saveData is on', () => {
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: true })
    const choice = pickAudioSource(song(true))
    expect(choice.quality).toBe('lq')
    expect(choice.reason).toBe('saveData')
  })

  it('prefers LQ when RTT is high despite a 4g label', () => {
    setConnection({ effectiveType: '4g', rtt: 900, downlink: 10, saveData: false })
    const choice = pickAudioSource(song(true))
    expect(choice.quality).toBe('lq')
    expect(choice.reason).toContain('rtt')
  })

  it('prefers LQ when downlink is low on an otherwise fast connection', () => {
    setConnection({ effectiveType: '4g', rtt: 100, downlink: 0.3, saveData: false })
    const choice = pickAudioSource(song(true))
    expect(choice.quality).toBe('lq')
    expect(choice.reason).toContain('downlink')
  })
})