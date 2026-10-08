import { useEffect } from 'react'
import type { CSSProperties } from 'react'

type Ember = {
  left: string
  top: string
  size: number
  dx: number
  rise: number
  delay: number
  dur: number
}

/** Rising sparks timed to drift up around the emblem during the reveal. */
const EMBERS: Ember[] = [
  { left: '36.6%', top: '26.3%', size: 3.4, dx: -22, rise: -113, delay: 1.19, dur: 1.35 },
  { left: '50.6%', top: '21.6%', size: 3.0, dx: -22, rise: -77, delay: 1.29, dur: 1.96 },
  { left: '21.4%', top: '29.4%', size: 3.4, dx: 23, rise: -116, delay: 1.24, dur: 2.08 },
  { left: '15.5%', top: '56.1%', size: 2.6, dx: -18, rise: -79, delay: 1.09, dur: 1.95 },
  { left: '25.7%', top: '44.4%', size: 3.4, dx: -7, rise: -114, delay: 0.66, dur: 1.35 },
  { left: '27.7%', top: '48.6%', size: 2.9, dx: -10, rise: -117, delay: 1.34, dur: 1.54 },
  { left: '72.4%', top: '49.4%', size: 2.5, dx: 4, rise: -112, delay: 2.08, dur: 1.88 },
  { left: '33.9%', top: '61.2%', size: 2.3, dx: -4, rise: -131, delay: 0.82, dur: 1.69 },
  { left: '15.0%', top: '48.1%', size: 3.7, dx: 4, rise: -140, delay: 1.1, dur: 1.86 },
  { left: '57.2%', top: '44.4%', size: 3.0, dx: 18, rise: -146, delay: 1.38, dur: 1.83 },
  { left: '16.6%', top: '49.5%', size: 3.4, dx: 26, rise: -136, delay: 1.05, dur: 1.61 },
  { left: '62.8%', top: '20.9%', size: 3.0, dx: -17, rise: -79, delay: 0.65, dur: 1.91 },
  { left: '21.8%', top: '30.4%', size: 2.9, dx: 19, rise: -76, delay: 1.34, dur: 1.74 },
  { left: '79.1%', top: '54.4%', size: 3.9, dx: -12, rise: -103, delay: 1.18, dur: 2.01 },
  { left: '84.8%', top: '26.3%', size: 2.4, dx: -14, rise: -89, delay: 1.4, dur: 1.77 },
  { left: '32.0%', top: '20.2%', size: 2.9, dx: -7, rise: -115, delay: 2.22, dur: 1.85 },
]

/** Matches the splash-exit animation delay in index.css (2.6s + 0.55s). */
const SPLASH_MS = 3300

/** Reduced motion swaps the choreography for a static emblem + early exit. */
const SPLASH_MS_REDUCED = 1600

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const timer = window.setTimeout(onDone, reduced ? SPLASH_MS_REDUCED : SPLASH_MS)
    return () => window.clearTimeout(timer)
  }, [onDone])

  const emblem = `${import.meta.env.BASE_URL}emblem-splash.webp`

  return (
    <div className="splash-screen" aria-hidden="true">
      <div className="splash-stage" style={{ '--em': `url(${emblem})` } as CSSProperties}>
        <div className="splash-layer splash-glow" />
        <div className="splash-layer splash-main" />
        <div className="splash-layer splash-shine" />
        <div className="splash-embers">
          {EMBERS.map((ember) => (
            <i
              key={`${ember.left}-${ember.top}`}
              style={
                {
                  left: ember.left,
                  top: ember.top,
                  width: ember.size,
                  height: ember.size,
                  '--dx': `${ember.dx}px`,
                  '--rise': `${ember.rise}px`,
                  animationDelay: `${ember.delay}s`,
                  animationDuration: `${ember.dur}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
