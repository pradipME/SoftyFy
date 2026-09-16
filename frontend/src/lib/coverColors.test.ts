// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { fallbackPalette, getCoverColors } from './coverColors'

const originalImage = globalThis.Image

afterEach(() => {
  globalThis.Image = originalImage
})

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

describe('getCoverColors', () => {
  it('resolves null for cross-origin covers without ever loading an image', async () => {
    let constructed = 0
    globalThis.Image = class Image {
      constructor() {
        constructed += 1
        throw new Error('must not be constructed for cross-origin covers')
      }
    } as unknown as typeof Image

    await expect(
      getCoverColors('https://drive.google.com/thumbnail?id=ABC123&sz=w1000'),
    ).resolves.toBeNull()
    expect(constructed).toBe(0)
  })

  it('resolves null when the image cannot be read (opaque cross-origin semantics)', async () => {
    globalThis.Image = class Image {
      onerror: (() => void) | null = null
      src = ''
      constructor() {
        queueMicrotask(() => this.onerror?.())
      }
    } as unknown as typeof Image

    await expect(getCoverColors('/covers/unreadable.jpg')).resolves.toBeNull()
  })
})