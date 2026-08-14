import { useState } from 'react'
import { MusicIcon } from '../ui/icons'

interface CoverProps {
  src: string
  alt: string
  className?: string
}

/**
 * Renders a song's cover art. Falls back to a gradient placeholder whenever
 * the image is missing or fails to load, so the UI never breaks.
 */
export function Cover({ src, alt, className = '' }: CoverProps) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-accent/25 via-surface to-elevated ${className}`}
      >
        <MusicIcon className="h-1/3 w-1/3 text-white/30" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`bg-elevated object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
