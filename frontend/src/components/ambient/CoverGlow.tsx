import type { ReactNode } from 'react'
import { useSongPalette } from '../../hooks/useSongPalette'
import type { Song } from '../../types/song'

interface CoverGlowProps {
  song: Song
  children: ReactNode
  className?: string
  /** Extra spacing around the glow. Tune per usage so it never overwhelms. */
  inset?: string
}

/**
 * A soft radial halo behind a cover, tinted by that song's palette. Gives the
 * artwork physical presence — like light spilling off it.
 */
export function CoverGlow({ song, children, className = '', inset = '-inset-6' }: CoverGlowProps) {
  const palette = useSongPalette(song.coverSrc, song.id)
  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute ${inset} rounded-full blur-2xl`}
        style={{
          background: `radial-gradient(58% 58% at 50% 50%, ${palette.primary}4d 0%, transparent 72%)`,
        }}
      />
      {children}
    </div>
  )
}
