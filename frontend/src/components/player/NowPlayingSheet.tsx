import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'framer-motion'
import { useEffect, useMemo } from 'react'
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
import { QualityNote } from './QualityNote'
import { QualitySetting } from './QualitySetting'

interface NowPlayingSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Native-style bottom sheet with spring physics. Drag down to dismiss.
 * The cover reacts to drag with scale/rotate parallax. Enhanced with
 * a richer glassmorphism surface and animated wave visualizer.
 */
export function NowPlayingSheet({ open, onClose }: NowPlayingSheetProps) {
  const { currentSong, status, shuffle, repeat, currentQuality, togglePlay, next, previous, toggleShuffle, cycleRepeat } =
    usePlayer()
  const reduced = useReducedMotion()

  useBackInterception(open, onClose)

  const y = useMotionValue(0)
  const coverScale = useTransform(y, [0, 360], [1, 0.82])
  const coverRotate = useTransform(y, [0, 360], [0, -6])
  const coverLift = useTransform(y, [0, 360], [0, -32])
  const backdropOpacity = useTransform(y, [0, 360], [1, 0.3])
  const sheetOpacity = useTransform(y, [0, 300], [1, 0.8])

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

  const coverSrc = useMemo(() => currentSong?.coverSrc ?? '', [currentSong])

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
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
        >
          <CoverBackground />
          <motion.div aria-hidden className="absolute inset-0 bg-black/40" style={{ opacity: backdropOpacity }} />

          <motion.div
            className="absolute inset-x-0 bottom-0 flex h-full flex-col overflow-hidden"
            style={{ y, opacity: sheetOpacity }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.12, bottom: 0.7 }}
            onDragEnd={onDragEnd}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Frosted glass surface */}
            <div className="absolute inset-0 bg-[#0a0a0e]/55 backdrop-blur-3xl" />
            {/* Top border gradient */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative flex h-full flex-col">
              {/* Drag handle */}
              <div className="flex shrink-0 justify-center pt-[calc(env(safe-area-inset-top)+10px)]">
                <div className="h-1 w-12 rounded-full bg-white/25" />
              </div>

              {/* Header row */}
              <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Collapse now playing"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-all hover:bg-white/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ChevronDownIcon className="h-6 w-6" />
                </button>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Now Playing</p>
                  {currentSong.album ? (
                    <p className="text-xs text-dim truncate max-w-[180px]">{currentSong.album}</p>
                  ) : null}
                </div>
                <span className="w-10" aria-hidden />
              </div>

              {/* Cover art */}
              <div className="flex min-h-0 flex-1 items-center justify-center px-8 py-2">
                <motion.div style={{ scale: coverScale, rotate: coverRotate, y: coverLift }}>
                  <CoverGlow song={currentSong} inset="-inset-10">
                    <div className="relative">
                      <Cover
                        key={currentSong.id}
                        src={coverSrc}
                        alt={currentSong.title}
                        className={`aspect-square w-[min(76vw,340px)] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] transition-all duration-500 ${
                          isPlaying ? 'scale-100' : 'scale-[0.94]'
                        }`}
                      />
                      {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/30">
                          <LoaderIcon className="h-8 w-8 animate-spin text-white/80" />
                        </div>
                      ) : null}
                    </div>
                  </CoverGlow>
                </motion.div>
              </div>

              {/* Song title + artist */}
              <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-2 pt-1">
                <div className="min-w-0">
                  <h2 className="truncate text-[22px] font-bold tracking-tight text-fg">{currentSong.title}</h2>
                  <p className="truncate text-base text-muted">{currentSong.artist}</p>
                  {currentQuality !== null ? <QualityNote quality={currentQuality} /> : null}
                </div>
                {isPlaying ? <WaveBars /> : null}
              </div>

              {/* Progress bar */}
              <div className="shrink-0 px-6 pb-2 pt-3">
                <ProgressBar />
              </div>

              {/* Transport controls */}
              <div className="flex shrink-0 items-center justify-between px-6 py-2">
                <IconButton
                  label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
                  onClick={toggleShuffle}
                  active={shuffle}
                >
                  <ShuffleIcon className={`h-5 w-5 ${shuffle ? 'text-accent' : ''}`} />
                </IconButton>

                <div className="flex items-center gap-3">
                  <IconButton label="Previous track" onClick={previous}>
                    <SkipBackIcon className="h-7 w-7" />
                  </IconButton>

                  {/* Big play button */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="mx-1 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-fg text-black shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-150 hover:scale-105 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50 active:scale-95"
                  >
                    {isLoading ? (
                      <LoaderIcon className="h-6 w-6 animate-spin" />
                    ) : isPlaying ? (
                      <PauseIcon className="h-7 w-7" />
                    ) : (
                      <PlayIcon className="h-8 w-8 translate-x-0.5" />
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

              {/* Volume + quality */}
              <div className="shrink-0 px-6 pb-2">
                <QualitySetting />
              </div>

              <div className="shrink-0 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                <div className="flex justify-center">
                  <VolumeControl />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/* ── 5-bar wave visualizer ────────────────────────────────────────────── */
function WaveBars() {
  return (
    <span className="flex h-5 shrink-0 items-end gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="wave-bar h-full w-1 rounded-full bg-accent"
        />
      ))}
    </span>
  )
}
