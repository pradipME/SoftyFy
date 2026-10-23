import { AnimatePresence, motion, useMotionValue, useReducedMotion, type PanInfo } from 'framer-motion'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { useBackInterception } from '../../hooks/useBackInterception'
import { CoverBackground } from '../ambient/CoverBackground'
import { Cover } from '../song/Cover'
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
import { QualityNote } from './QualityNote'
import { QualitySetting } from './QualitySetting'

interface NowPlayingSheetProps { open: boolean; onClose: () => void }

/** Expanded cinematic transport with artwork and stream settings. */
export function NowPlayingSheet({ open, onClose }: NowPlayingSheetProps) {
  const {
    currentSong, status, shuffle, repeat, currentQuality,
    togglePlay, next, previous, toggleShuffle, cycleRepeat,
  } = usePlayer()
  const reduced = useReducedMotion()
  useBackInterception(open, onClose)

  const y = useMotionValue(0)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  if (!currentSong) return null

  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="now-playing"
          role="dialog"
          aria-modal="true"
          aria-label={`Now playing: ${currentSong.title} by ${currentSong.artist}`}
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
        >
          <CoverBackground />
          <motion.div aria-hidden className="absolute inset-0 bg-black/55" />
          <motion.div
            className="sonic-now-playing"
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 34, mass: 0.9 }}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.72 }}
            onDragEnd={onDragEnd}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sonic-now-playing-inner">
              <div className="sonic-now-art-column">
                <div className="sonic-now-art-frame">
                  <Cover key={currentSong.id} src={currentSong.coverSrc} alt={`${currentSong.title} cover art`} />
                  {isLoading && <span className="absolute inset-0 grid place-items-center bg-black/35"><LoaderIcon className="h-8 w-8 animate-spin text-white" /></span>}
                </div>
              </div>

              <section className="sonic-now-play-column" aria-label="Playback details">
                <div className="sonic-now-heading">
                  <span>SoftyFy · Now playing</span>
                  <button type="button" className="sonic-now-close" onClick={onClose} aria-label="Collapse now playing"><ChevronDownIcon /></button>
                </div>

                <p className="sonic-now-album">{currentSong.album || currentSong.library}</p>
                <h2 className="sonic-now-title">{currentSong.title}</h2>
                <p className="sonic-now-artist">{currentSong.artist}</p>
                {currentQuality && <div className="mt-2"><QualityNote quality={currentQuality} /></div>}

                <div className="sonic-player-progress"><ProgressBar /></div>
                <div className="sonic-now-transport">
                  <ControlButton label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'} active={shuffle} onClick={toggleShuffle}><ShuffleIcon /></ControlButton>
                  <ControlButton label="Previous track" onClick={previous}><SkipBackIcon /></ControlButton>
                  <button type="button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : isLoading ? 'Loading' : 'Play'} className="sonic-play-button">
                    {isLoading ? <LoaderIcon className="animate-spin" /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <ControlButton label="Next track" onClick={next}><SkipForwardIcon /></ControlButton>
                  <ControlButton label={repeat === 'off' ? 'Turn repeat on' : repeat === 'all' ? 'Repeat all, switch to repeat one' : 'Turn repeat off'} active={repeat !== 'off'} onClick={cycleRepeat}>
                    <span className="relative"><RepeatIcon />{repeat === 'one' && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[8px] font-bold text-black">1</span>}</span>
                  </ControlButton>
                </div>

                <div className="sonic-now-settings">
                  <div className="sonic-now-quality"><QualitySetting /></div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ControlButton({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={`sonic-control-button${active ? ' is-active' : ''}`} aria-label={label} aria-pressed={active} onClick={onClick}>{children}</button>
}
