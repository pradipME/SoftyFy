import { describe, expect, it } from 'vitest'
import { buildAudioCandidates, preferKnownGood } from './audioSources'

const DRIVE_URL =
  'https://drive.usercontent.google.com/download?id=ABC123&export=download'

describe('buildAudioCandidates', () => {
  it('returns only the original source for local or unknown URLs', () => {
    expect(buildAudioCandidates('/audio/track-01.mp3')).toEqual(['/audio/track-01.mp3'])
    expect(buildAudioCandidates('https://cdn.example.com/a.mp3')).toEqual([
      'https://cdn.example.com/a.mp3',
    ])
  })

  it('returns only the keyless download URL for Drive songs — no fallback hosts', () => {
    expect(buildAudioCandidates(DRIVE_URL)).toEqual([DRIVE_URL])
  })

  it('ignores non-download Drive URLs', () => {
    expect(
      buildAudioCandidates('https://drive.usercontent.google.com/download?id=ABC123'),
    ).toEqual(['https://drive.usercontent.google.com/download?id=ABC123'])
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