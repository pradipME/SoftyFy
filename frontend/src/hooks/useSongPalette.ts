import { useEffect, useState } from 'react'
import { fallbackPalette, getCoverColors, type CoverPalette } from '../lib/coverColors'

/**
 * Resolves a song's ambient palette. Starts from a deterministic per-song
 * fallback so the UI is never colorless, then upgrades to colors extracted
 * from the cover art once it loads (cached by the extraction utility).
 */
export function useSongPalette(coverSrc: string | undefined, seed: string): CoverPalette {
  const [palette, setPalette] = useState<CoverPalette>(() => fallbackPalette(seed))

  useEffect(() => {
    setPalette(fallbackPalette(seed))
    if (!coverSrc) return
    let alive = true
    getCoverColors(coverSrc).then((extracted) => {
      if (alive && extracted !== null) setPalette(extracted)
    })
    return () => {
      alive = false
    }
  }, [coverSrc, seed])

  return palette
}
