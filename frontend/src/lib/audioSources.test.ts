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

  it('expands a Drive API URL into three hosts starting with the original', () => {
    const [first, ...rest] = buildAudioCandidates(DRIVE_API)
    expect(first).toBe(DRIVE_API)
    expect(rest).toEqual([
      'https://drive.usercontent.google.com/download?id=ABC123&export=download&key=SECRET',
      'https://drive.google.com/uc?export=download&confirm=t&id=ABC123',
    ])
  })

  it('ignores non-media Drive API URLs', () => {
    expect(
      buildAudioCandidates('https://www.googleapis.com/drive/v3/files/ABC123'),
    ).toEqual(['https://www.googleapis.com/drive/v3/files/ABC123'])
  })
})

describe('preferKnownGood', () => {
  it('moves a known-good URL to the front', () => {
    const candidates = buildAudioCandidates(DRIVE_API)
    const ordered = preferKnownGood(candidates, candidates[2])
    expect(ordered[0]).toBe(candidates[2])
    expect(ordered).toHaveLength(candidates.length)
  })

  it('keeps order when there is no known-good URL', () => {
    const candidates = buildAudioCandidates(DRIVE_API)
    expect(preferKnownGood(candidates)).toEqual(candidates)
  })

  it('keeps single-entry lists untouched', () => {
    const candidates = ['/audio/track-01.mp3']
    expect(preferKnownGood(candidates, '/other.mp3')).toEqual(candidates)
  })
})