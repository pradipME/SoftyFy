import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'framer-motion'
import { useEffect } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { useBackInterception } from '../../hooks/useBackInterception'
import { CoverBackground } from '../ambient/CoverBackground'
import { CoverGlow } from '../ambient/CoverGlow'
import { Cover } from '../song/Cover'
import { IconButton } from '../ui/IconButton'
import {
  ChevronDownIcon,
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from '../ui/icons'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'

interface NowPlayingSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Native-style bottom sheet with spring physics. Drag down to "give" (rubber
 * band) then release — it snaps back under the threshold or dismisses past it.
 * The cover reacts to the drag with a slight scale/lift parallax. Tap the
 * chevron, Escape, or the backdrop to close.
 *
 * The sheet is a translucent glass surface over the same ambient blurred
 * album-cover background (CoverBackground) that sits behind the rest of the
 * app, so the artwork stays visible behind the Now Playing UI. The browser/
 * Android Back button is intercepted while open: it dismisses just the sheet,
 * leaving the app's hash navigation history untouched.
 */
export function NowPlayingSheet({ open, onClose }: NowPlayingSheetProps) {
  const { currentSong, status, shuffle, repeat, togglePlay, next, previous, toggleShuffle, cycleRepeat } =
    usePlayer()
  const reduced = useReducedMotion()

  useBackInterception(open, onClose)

  const y = useMotionValue(0)
  const coverScale = useTransform(y, [0, 360], [1, 0.86])
  const coverRotate = useTransform(y, [0, 360], [0, -5])
  const coverLift = useTransform(y, [0, 360], [0, -28])
  const backdropOpacity = useTransform(y, [0, 360], [1, 0.4])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  if (currentSong === null) return null

  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="now-playing"
          role="dialog"
          aria-modal="true"
          aria-label={`Now playing: ${currentSong.title} by ${currentSong.artist}`}
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
        >
          <CoverBackground />
          <motion.div aria-hidden className="absolute inset-0 bg-black/30" style={{ opacity: backdropOpacity }} />

          <motion.div
            className="absolute inset-x-0 bottom-0 flex h-full flex-col overflow-hidden border-t border-white/10 bg-[#0c0c10]/45 backdrop-blur-2xl"
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.15, bottom: 0.7 }}
            onDragEnd={onDragEnd}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 justify-center pt-[calc(env(safe-area-inset-top)+12px)]">
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>

            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                aria-label="Collapse now playing"
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronDownIcon className="h-6 w-6" />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Now playing</p>
              <span className="w-11" aria-hidden />
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center px-6">
              <motion.div style={{ scale: coverScale, rotate: coverRotate, y: coverLift }}>
                <motion.div
                  animate={reduced ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <CoverGlow song={currentSong} inset="-inset-10">
                    <div className="relative">
                      <Cover
                        src={currentSong.coverSrc}
                        alt={currentSong.title}
                        className="aspect-square w-[min(78vw,340px)] rounded-2xl shadow-2xl shadow-black/60"
                      />
                      {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
                          <LoaderIcon className="h-8 w-8 animate-spin text-white/80" />
                        </div>
                      ) : null}
                    </div>
                  </CoverGlow>
                </motion.div>
              </motion.div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-1">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold tracking-tight text-fg">{currentSong.title}</h2>
                <p className="truncate text-sm text-muted">{currentSong.artist}</p>
              </div>
              {isPlaying ? <EqualizerBars /> : null}
            </div>

            <div className="shrink-0 px-4 pb-1 pt-2">
              <ProgressBar />
            </div>

            <div className="flex shrink-0 items-center justify-between px-6 py-3">
              <IconButton
                label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
                onClick={toggleShuffle}
                active={shuffle}
              >
                <ShuffleIcon className={`h-5 w-5 ${shuffle ? 'text-accent' : ''}`} />
              </IconButton>
              <div className="flex items-center gap-2">
                <IconButton label="Previous track" onClick={previous}>
                  <SkipBackIcon className="h-7 w-7" />
                </IconButton>
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="mx-1 flex h-16 w-16 items-center justify-center rounded-full bg-fg text-black shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {isLoading ? (
                    <LoaderIcon className="h-6 w-6 animate-spin" />
                  ) : isPlaying ? (
                    <PauseIcon className="h-7 w-7" />
                  ) : (
                    <PlayIcon className="h-7 w-7" />
                  )}
                </button>
                <IconButton label="Next track" onClick={next}>
                  <SkipForwardIcon className="h-7 w-7" />
                </IconButton>
              </div>
              <IconButton
                label={
                  repeat === 'off'
                    ? 'Repeat off — turn repeat on'
                    : repeat === 'all'
                      ? 'Repeat all — turn repeat one on'
                      : 'Repeat one — turn repeat off'
                }
                onClick={cycleRepeat}
                active={repeat !== 'off'}
              >
                <span className="relative">
                  <RepeatIcon className={`h-5 w-5 ${repeat !== 'off' ? 'text-accent' : ''}`} />
                  {repeat === 'one' ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-black">
                      1
                    </span>
                  ) : null}
                </span>
              </IconButton>
            </div>

            <div className="shrink-0 pb-[calc(env(safe-area-inset-bottom)+10px)]">
              <div className="flex justify-center">
                <VolumeControl />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function EqualizerBars() {
  return (
    <span className="flex h-4 shrink-0 items-end gap-0.5" aria-hidden>
      <span className="eq-bar h-full w-1 bg-accent" style={{ animationDelay: '0ms' }} />
      <span className="eq-bar h-full w-1 bg-accent" style={{ animationDelay: '180ms' }} />
      <span className="eq-bar h-full w-1 bg-accent" style={{ animationDelay: '360ms' }} />
    </span>
  )
}
