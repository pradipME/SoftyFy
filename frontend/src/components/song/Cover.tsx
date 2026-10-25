import { useState } from 'react'
import { MusicIcon } from '../ui/icons'

interface CoverProps {
  src: string
  alt: string
  className?: string
  /** Request a thumbnail close to its rendered size (Google Drive covers only). */
  width?: number
  /** Load immediately for the primary artwork at the top of a screen. */
  priority?: boolean
}

/**
 * Renders a song's cover art. Falls back to a gradient placeholder whenever
 * the image is missing or fails to load, so the UI never breaks.
 */
export function Cover({ src, alt, className = '', width, priority = false }: CoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const imageSrc = thumbnailForWidth(src, width)

  if (!src || failedSrc === src) {
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
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={`bg-elevated object-cover ${className}`}
      onError={() => setFailedSrc(src)}
    />
  )
}

function thumbnailForWidth(src: string, width?: number): string {
  if (!width) return src

  try {
    const url = new URL(src)
    if (url.hostname === 'drive.google.com' && url.pathname === '/thumbnail') {
      url.searchParams.set('sz', `w${Math.max(64, Math.min(1000, Math.round(width)))}`)
      return url.toString()
    }
  } catch {
    // Relative/local assets don't need URL resizing.
  }

  return src
}
