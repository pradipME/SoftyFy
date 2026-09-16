import { describe, expect, it } from 'vitest'
import { buildAudioCandidates, preferKnownGood } from './audioSources'

const RELEASE_URL =
  'https://github.com/pradipME/SoftyFy/releases/download/softyfy-audio-v1/A-B_C.mp3'

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