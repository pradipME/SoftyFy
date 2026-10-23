import { useEffect } from 'react'
import type { CSSProperties } from 'react'

const SPLASH_MS = 900

/** Brief, static brand splash while the app starts. */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const emblem = `${import.meta.env.BASE_URL}emblem-splash.webp`

  useEffect(() => {
    const timer = window.setTimeout(onDone, SPLASH_MS)

    const probe = new window.Image()
    probe.onerror = onDone
    probe.src = emblem

    return () => {
      window.clearTimeout(timer)
      probe.onerror = null
    }
  }, [onDone, emblem])

  return (
    <div className="splash-screen" aria-hidden="true">
      <div className="splash-logo" style={{ '--em': `url(${emblem})` } as CSSProperties} />
    </div>
  )
}
