import { describe, expect, it } from 'vitest'
import { formatPlaybackTime } from './format'

describe('formatPlaybackTime', () => {
  it('formats sub-minute times', () => {
    expect(formatPlaybackTime(0)).toBe('0:00')
    expect(formatPlaybackTime(5)).toBe('0:05')
    expect(formatPlaybackTime(65)).toBe('1:05')
  })

  it('formats minute-heavy times', () => {
    expect(formatPlaybackTime(754)).toBe('12:34')
  })

  it('formats hour-long times', () => {
    expect(formatPlaybackTime(3765)).toBe('1:02:45')
    expect(formatPlaybackTime(3720)).toBe('1:02:00')
  })

  it('handles non-finite and negative input', () => {
    expect(formatPlaybackTime(Number.NaN)).toBe('0:00')
    expect(formatPlaybackTime(Number.POSITIVE_INFINITY)).toBe('0:00')
    expect(formatPlaybackTime(Number.NEGATIVE_INFINITY)).toBe('0:00')
    expect(formatPlaybackTime(-1)).toBe('0:00')
  })

  it('rounds fractional seconds down', () => {
    expect(formatPlaybackTime(1.9)).toBe('0:01')
    expect(formatPlaybackTime(59.99)).toBe('0:59')
  })
})
