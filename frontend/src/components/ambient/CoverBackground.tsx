import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { usePlayer } from '../../context/PlayerContext'

/**
 * Dynamic blurred album-cover backdrop for the ambient player.
 *
 * While a song is active its cover art is rendered full-screen behind the app:
 * heavily blurred (~50px), scaled past the viewport so no hard edges show,
 * dimmed to a low opacity, and topped with a dark tint + vignette so the UI
 * stays crisp and readable. Layers crossfade smoothly as the song changes, and
 * the component renders nothing when there is no song/cover — letting the
 * existing AmbientBackground gradient show through untouched.
 *
 * Purely decorative: pointer-events-none and aria-hidden, layered at z-0 below
 * all app content (mini player, nav, sheets all sit above it).
 */
export function CoverBackground() {
  const { currentSong } = usePlayer()
  const src = currentSong?.coverSrc

  if (!src) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <CoverLayer key={currentSong.id} src={src} />
      </AnimatePresence>
      <AmbientOverlay />
    </div>
  )
}

/**
 * One crossfading layer per song. The image only fades in once it has actually
 * loaded (a cached cover loads almost instantly), so the layer never flashes a
 * blank frame on song change or on first paint.
 */
function CoverLayer({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className="h-full w-full scale-110 object-cover blur-[50px] opacity-40"
      />
    </motion.div>
  )
}

/**
 * Static dark tint + radial vignette over the blurred art. Keeps the center of
 * the screen (where content lives) readable while the edges fall into shadow.
 */
function AmbientOverlay() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(rgba(18, 18, 18, 0.5), rgba(18, 18, 18, 0.5)), radial-gradient(ellipse 90% 75% at 50% 40%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%)',
      }}
    />
  )
}
