import type { CSSProperties, ReactNode } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { Cover } from '../song/Cover'
import {
  ChevronUpIcon,
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from '../ui/icons'
import { VolumeControl } from './VolumeControl'
import { ProgressBar } from './ProgressBar'

interface PlayerBarProps { onOpenSheet: () => void }

/** Persistent desktop transport and a compact mobile listening strip. */
export function PlayerBar({ onOpenSheet }: PlayerBarProps) {
  const {
    currentSong, status, currentTime, duration, shuffle, repeat, error,
    togglePlay, next, previous, toggleShuffle, cycleRepeat,
  } = usePlayer()

  if (!currentSong) return null

  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'
  const total = duration > 0 ? duration : currentSong.durationSec
  const percent = total > 0 ? (Math.min(currentTime, total) / total) * 100 : 0
  const playIcon = isLoading ? <LoaderIcon className="animate-spin" /> : isPlaying ? <PauseIcon /> : <PlayIcon />
  const playLabel = isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'

  return (
    <>
      <div className="sonic-playerbar hidden md:grid" style={{ '--play-progress': `${percent}%` } as CSSProperties} aria-label="Playback controls">
        <button type="button" onClick={onOpenSheet} className="sonic-player-track" aria-label={`Open now playing: ${currentSong.title}`}>
          <Cover src={currentSong.coverSrc} alt="" className="sonic-player-cover" />
          <span className="sonic-player-info">
            <strong>{currentSong.title}</strong>
            <span className={error ? 'text-danger' : ''}>{error ? 'Unable to play this track' : currentSong.artist}</span>
          </span>
        </button>

        <div className="sonic-player-center">
          <div className="sonic-player-controls">
            <ControlButton label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'} active={shuffle} onClick={toggleShuffle}><ShuffleIcon /></ControlButton>
            <ControlButton label="Previous track" onClick={previous}><SkipBackIcon /></ControlButton>
            <button type="button" onClick={togglePlay} aria-label={playLabel} className="sonic-play-button">{playIcon}</button>
            <ControlButton label="Next track" onClick={next}><SkipForwardIcon /></ControlButton>
            <ControlButton label={repeat === 'off' ? 'Turn repeat on' : repeat === 'all' ? 'Repeat all, switch to repeat one' : 'Turn repeat off'} active={repeat !== 'off'} onClick={cycleRepeat}>
              <span className="relative"><RepeatIcon />{repeat === 'one' && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[8px] font-bold text-black">1</span>}</span>
            </ControlButton>
          </div>
          <div className="sonic-player-progress"><ProgressBar /></div>
        </div>

        <div className="sonic-player-tools">
          <VolumeControl />
          <button type="button" className="sonic-expand-button" onClick={onOpenSheet} aria-label="Expand now playing"><ChevronUpIcon /></button>
        </div>
      </div>

      <div className="sonic-mobile-player md:hidden" style={{ '--play-progress': `${percent}%` } as CSSProperties}>
        <button type="button" onClick={onOpenSheet} className="sonic-player-track" aria-label={`Open now playing: ${currentSong.title}`}>
          <Cover src={currentSong.coverSrc} alt="" className="sonic-player-cover" />
          <span className="sonic-player-info"><strong>{currentSong.title}</strong><span>{error ? 'Unable to play this track' : currentSong.artist}</span></span>
        </button>
        <button type="button" onClick={togglePlay} aria-label={playLabel} className="sonic-play-button">{playIcon}</button>
      </div>
    </>
  )
}

function ControlButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return <button type="button" className={`sonic-control-button${active ? ' is-active' : ''}`} aria-label={label} aria-pressed={active} onClick={onClick}>{children}</button>
}
