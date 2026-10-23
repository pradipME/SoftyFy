import { AnimatePresence, motion, useMotionValue, useReducedMotion, type PanInfo, type Variants } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { useLikedSong } from '../../hooks/useLikedSong'
import { useBackInterception } from '../../hooks/useBackInterception'
import { CoverBackground } from '../ambient/CoverBackground'
import { Cover } from '../song/Cover'
import {
  ChevronDownIcon,
  HeartIcon,
  LoaderIcon,
  MoreIcon,
  PauseIcon,
  PlayIcon,
  QueueIcon,
  RepeatIcon,
  ShareIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '../ui/icons'
import { ProgressBar } from './ProgressBar'
import { QualityNote } from './QualityNote'
import { QualitySetting } from './QualitySetting'

interface NowPlayingSheetProps { open: boolean; onClose: () => void; artworkLayoutId?: string }

const artworkVariants: Variants = {
  enter: (direction: number) => ({ x: direction * 46, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 360, damping: 34 } },
  exit: (direction: number) => ({ x: direction * -46, opacity: 0, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' } }),
}

const songInfoVariants: Variants = {
  enter: (direction: number) => ({ x: direction * 18, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: (direction: number) => ({ x: direction * -18, opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }),
}

/** Expanded cinematic transport with artwork and stream settings. */
export function NowPlayingSheet({ open, onClose, artworkLayoutId }: NowPlayingSheetProps) {
  const {
    currentSong, status, shuffle, repeat, currentQuality, upcomingSongs, muted, volume,
    togglePlay, next, previous, toggleShuffle, cycleRepeat, toggleMute, setVolume,
  } = usePlayer()
  const { liked, toggleLiked } = useLikedSong(currentSong?.id)
  const [queueOpen, setQueueOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [trackDirection, setTrackDirection] = useState(1)
  const reduced = useReducedMotion()
  useBackInterception(open, onClose)

  const y = useMotionValue(0)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (moreOpen) setMoreOpen(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, moreOpen])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  const playNext = () => { setTrackDirection(1); next() }
  const playPrevious = () => { setTrackDirection(-1); previous() }

  const shareSong = async () => {
    if (!currentSong) return
    const details = `${currentSong.title} — ${currentSong.artist}`
    if (navigator.share) {
      try { await navigator.share({ title: currentSong.title, text: details }) } catch { /* Share sheet dismissed. */ }
    } else {
      await navigator.clipboard?.writeText(details)
    }
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
              <div className="metro-now-top-heading">
                <div className="metro-now-label"><span>Now Playing</span><small>{currentSong.library} Mix</small></div>
                <button type="button" className="sonic-now-close" onClick={onClose} aria-label="Collapse now playing"><ChevronDownIcon /></button>
              </div>
              <motion.div
                className="sonic-now-art-column"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.36, ease: 'easeOut', delay: 0.06 }}
              >
                <div className="sonic-now-art-frame">
                  <motion.div className="sonic-now-art-window" layoutId={artworkLayoutId}>
                    <AnimatePresence initial={false} mode="sync" custom={trackDirection}>
                      <motion.div
                        key={currentSong.id}
                        className="sonic-now-art-swap"
                        custom={trackDirection}
                        variants={artworkVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                      >
                        <Cover src={currentSong.coverSrc} alt={`${currentSong.title} cover art`} className="sonic-now-art-image" />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                  {isLoading && <span className="absolute inset-0 grid place-items-center bg-black/35"><LoaderIcon className="h-8 w-8 animate-spin text-white" /></span>}
                </div>
              </motion.div>

              <motion.section
                className="sonic-now-play-column"
                aria-label="Playback details"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut', delay: 0.12 }}
              >
                <div className="sonic-now-heading">
                  <span>SoftyFy · Now playing</span>
                  <button type="button" className="sonic-now-close" onClick={onClose} aria-label="Collapse now playing"><ChevronDownIcon /></button>
                </div>

                <div className="metro-now-song-row">
                  <div className="metro-now-song-copy">
                    <AnimatePresence initial={false} mode="wait" custom={trackDirection}>
                      <motion.div
                        key={currentSong.id}
                        className="metro-now-song-swap"
                        custom={trackDirection}
                        variants={songInfoVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                      >
                        <h2 className="sonic-now-title">{currentSong.title}</h2>
                        <p className="sonic-now-artist">{currentSong.artist}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="metro-now-song-actions">
                    <button type="button" onClick={shareSong} aria-label="Share song"><ShareIcon /></button>
                    <button type="button" onClick={toggleLiked} aria-label={liked ? 'Remove from liked songs' : 'Like song'} aria-pressed={liked} className={liked ? 'is-liked' : ''}><HeartIcon /></button>
                  </div>
                </div>
                {currentQuality && <div className="mt-2 metro-quality-note"><QualityNote quality={currentQuality} /></div>}

                <div className="sonic-player-progress"><ProgressBar /></div>
                <div className="sonic-now-transport">
                  <ControlButton label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'} active={shuffle} onClick={toggleShuffle}><ShuffleIcon /></ControlButton>
                  <ControlButton label="Previous track" onClick={playPrevious}><SkipBackIcon /></ControlButton>
                  <motion.button type="button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : isLoading ? 'Loading' : 'Play'} className="sonic-play-button" whileTap={{ scale: 0.96 }}>
                    <AnimatePresence initial={false} mode="wait">
                      <motion.span key={isLoading ? 'loading' : isPlaying ? 'pause' : 'play'} initial={{ opacity: 0, scale: 0.72, rotate: -18 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.72, rotate: 18 }} transition={{ duration: 0.14 }}>
                        {isLoading ? <LoaderIcon className="animate-spin" /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </motion.span>
                    </AnimatePresence>
                    <span className="metro-play-label">{isPlaying ? 'Pause' : 'Play'}</span>
                  </motion.button>
                  <ControlButton label="Next track" onClick={playNext}><SkipForwardIcon /></ControlButton>
                  <ControlButton label={repeat === 'off' ? 'Turn repeat on' : repeat === 'all' ? 'Repeat all, switch to repeat one' : 'Turn repeat off'} active={repeat !== 'off'} onClick={cycleRepeat}>
                    <span className="relative"><RepeatIcon />{repeat === 'one' && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[8px] font-bold text-black">1</span>}</span>
                  </ControlButton>
                </div>

                <div className="metro-now-tools">
                  <button type="button" onClick={() => setQueueOpen((value) => !value)} aria-label="Toggle queue" aria-pressed={queueOpen}><QueueIcon /></button>
                  <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>{muted ? <VolumeMuteIcon /> : <VolumeIcon />}</button>
                  <button type="button" onClick={toggleShuffle} aria-label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'} aria-pressed={shuffle} className={shuffle ? 'is-active' : ''}><ShuffleIcon /></button>
                  <button type="button" onClick={cycleRepeat} aria-label={repeat === 'off' ? 'Turn repeat on' : repeat === 'all' ? 'Repeat all, switch to repeat one' : 'Turn repeat off'} aria-pressed={repeat !== 'off'} className={repeat !== 'off' ? 'is-active' : ''}><RepeatIcon /></button>
                  <button type="button" className="metro-more-button" onClick={() => setMoreOpen(true)} aria-label="More playback options" aria-expanded={moreOpen}><MoreIcon /></button>
                </div>
                <AnimatePresence initial={false}>
                  {queueOpen && <motion.section key="queue-panel" className="metro-queue-panel" aria-label="Upcoming songs" initial={{ opacity: 0, height: 0, y: 12 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: 8 }} transition={{ duration: 0.22, ease: 'easeOut' }}><h3>Up next</h3>{upcomingSongs.length ? upcomingSongs.slice(0, 6).map((song) => <div className="metro-queue-item" key={song.id}><Cover src={song.coverSrc} alt="" /><span><strong>{song.title}</strong><small>{song.artist}</small></span></div>) : <p>No more songs in the queue.</p>}</motion.section>}
                </AnimatePresence>
              </motion.section>
            </div>
          </motion.div>
          <AnimatePresence>
            {moreOpen && (
              <motion.div className="metro-playback-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={(event) => { event.stopPropagation(); setMoreOpen(false) }}>
                <motion.section
                  role="dialog"
                  aria-modal="true"
                  aria-label="Playback options"
                  className="metro-playback-sheet"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
                  drag={reduced ? false : 'y'}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.65 }}
                  onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 550) setMoreOpen(false) }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="metro-playback-sheet-handle" />
                  <div className="metro-playback-sheet-track"><Cover src={currentSong.coverSrc} alt="" /><span><strong>{currentSong.title}</strong><small>{currentSong.artist}</small></span></div>
                  <div className="metro-sheet-volume">
                    <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeMuteIcon /> : <VolumeIcon />}</button>
                    <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={(event) => { const nextVolume = Number(event.target.value); if (muted && nextVolume > 0) toggleMute(); setVolume(nextVolume) }} />
                  </div>
                  <div className="metro-playback-sheet-actions">
                    <button type="button" onClick={() => { setQueueOpen(true); setMoreOpen(false) }}><QueueIcon /><span>Queue</span></button>
                    <button type="button" onClick={() => { void shareSong(); setMoreOpen(false) }}><ShareIcon /><span>Share</span></button>
                  </div>
                  <div className="metro-playback-sheet-quality"><QualitySetting /></div>
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ControlButton({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return <motion.button type="button" className={`sonic-control-button${active ? ' is-active' : ''}`} aria-label={label} aria-pressed={active} onClick={onClick} whileTap={{ scale: 0.9 }}>{children}</motion.button>
}
