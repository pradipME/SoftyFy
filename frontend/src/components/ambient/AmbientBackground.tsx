import { AnimatePresence, motion } from 'framer-motion'
import { usePlayer } from '../../context/PlayerContext'
import { useSongPalette } from '../../hooks/useSongPalette'

const IDLE_COLORS = { primary: '#27313b', secondary: '#141920' }

/**
 * The signature "Ambient Depth" layer: a fixed, out-of-focus gradient tinted by
 * the current song's cover art, crossfading slowly as songs change. It sits
 * behind every screen and bleeds through the frosted-glass player surfaces.
 */
export function AmbientBackground() {
  const { currentSong } = usePlayer()
  const seed = currentSong?.id ?? 'idle'
  const palette = useSongPalette(currentSong?.coverSrc, seed)
  const { primary, secondary } = currentSong ? palette : IDLE_COLORS

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={seed}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div
            className="absolute -left-1/4 -top-1/3 h-[135%] w-[135%]"
            style={{
              background: `radial-gradient(58% 52% at 30% 20%, ${primary}2e 0%, transparent 62%), radial-gradient(46% 42% at 80% 92%, ${secondary}29 0%, transparent 62%), radial-gradient(36% 32% at 70% 30%, ${primary}17 0%, transparent 60%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
