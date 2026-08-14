import { describe, expect, it } from 'vitest'
import { fallbackPalette } from './coverColors'

describe('fallbackPalette', () => {
  it('is deterministic for a seed', () => {
    expect(fallbackPalette('inaam-anuv-jain')).toEqual(fallbackPalette('inaam-anuv-jain'))
  })

  it('produces distinct hues per song', () => {
    const a = fallbackPalette('inaam-anuv-jain')
    const b = fallbackPalette('gul')
    expect(a.primary).not.toBe(b.primary)
    expect(a.secondary).not.toBe(b.secondary)
  })

  it('returns valid 6-digit hex colors', () => {
    const palette = fallbackPalette('afsos')
    expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(palette.secondary).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
