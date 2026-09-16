import { describe, expect, it } from 'vitest'
import { buildAudioCandidates, preferKnownGood } from './audioSources'

const DRIVE_API =
  'https://www.googleapis.com/drive/v3/files/ABC123?alt=media&key=SECRET'

describe('buildAudioCandidates', () => {
  it('returns only the original source for local or unknown URLs', () => {
    expect(buildAudioCandidates('/audio/track-01.mp3')).toEqual(['/audio/track-01.mp3'])
    expect(buildAudioCandidates('https://cdn.example.com/a.mp3')).toEqual([
      'https://cdn.example.com/a.mp3',
    ])
  })

  it('returns only the googleapis media URL for Drive songs — no dead fallback hosts', () => {
    expect(buildAudioCandidates(DRIVE_API)).toEqual([DRIVE_API])
  })

  it('ignores non-media Drive API URLs', () => {
    expect(
      buildAudioCandidates('https://www.googleapis.com/drive/v3/files/ABC123'),
    ).toEqual(['https://www.googleapis.com/drive/v3/files/ABC123'])
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