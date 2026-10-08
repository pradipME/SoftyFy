import { useMemo } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { CoverGlow } from '../ambient/CoverGlow'
import { Cover } from '../song/Cover'
import { IconButton } from '../ui/IconButton'
import {
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from '../ui/icons'
import { VolumeControl } from './VolumeControl'
import { QualityNote } from './QualityNote'

interface PlayerBarProps {
  onOpenSheet: () => void
}

/**
 * Floating frosted-glass mini player. Hovers just above the bottom nav with a
 * soft shadow and cover glow. Tap the song info to expand the sheet.
 */
export function PlayerBar({ onOpenSheet }: PlayerBarProps) {
  const {
    currentSong,
    status,
    currentTime,
    duration,
    shuffle,
    repeat,
    currentQuality,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer()

  const coverSrc = useMemo(() => currentSong?.coverSrc ?? '', [currentSong])

  if (currentSong === null) return null

  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'
  const isError = status === 'error'
  const total = duration > 0 ? duration : currentSong.durationSec
  const percent = total > 0 ? (Math.min(currentTime, total) / total) * 100 : 0

  const playLabel = isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-40 md:bottom-4 md:left-1/2 md:right-auto md:w-full md:max-w-2xl md:-translate-x-1/2">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-base/80 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-3xl">

        {/* Progress track — thin accent line at very top */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-300 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex min-h-[68px] items-center gap-2 px-2.5 py-2 sm:px-3">
          {/* Song info — tap to open sheet */}
          <button
            type="button"
            onClick={onOpenSheet}
            aria-label={`Now playing: ${currentSong.title} — tap to expand`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CoverGlow song={currentSong} inset="-inset-4" className="shrink-0">
              <div className="relative">
                <Cover
                  key={currentSong.id}
                  src={coverSrc}
                  alt={currentSong.title}
                  className={`h-12 w-12 rounded-xl shadow-lg transition-all duration-300 ${isPlaying ? 'scale-105 shadow-accent/20' : ''}`}
                />
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                    <LoaderIcon className="h-3.5 w-3.5 animate-spin text-white/80" />
                  </div>
                ) : null}
              </div>
            </CoverGlow>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg leading-tight">{currentSong.title}</p>
              <p className={`truncate text-xs leading-tight ${isError ? 'text-danger' : 'text-muted'}`}>
                {isError ? 'Unable to play this song.' : currentSong.artist}
              </p>
              {currentQuality !== null ? <QualityNote quality={currentQuality} /> : null}
            </div>
          </button>

          {/* Desktop controls */}
          <div className="hidden items-center gap-0.5 md:flex">
            <IconButton
              label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
              onClick={toggleShuffle}
              active={shuffle}
            >
              <ShuffleIcon className={`h-4 w-4 ${shuffle ? 'text-accent' : ''}`} />
            </IconButton>
            <IconButton label="Previous track" onClick={previous}>
              <SkipBackIcon className="h-5 w-5" />
            </IconButton>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playLabel}
              className="mx-1 flex h-11 w-11 items-center justify-center rounded-full bg-fg text-black shadow-lg transition-all duration-150 hover:scale-105 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
            >
              {isLoading ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>
            <IconButton label="Next track" onClick={next}>
              <SkipForwardIcon className="h-5 w-5" />
            </IconButton>
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
                <RepeatIcon className={`h-4 w-4 ${repeat !== 'off' ? 'text-accent' : ''}`} />
                {repeat === 'one' ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-black">
                    1
                  </span>
                ) : null}
              </span>
            </IconButton>
          </div>

          <VolumeControl />

          {/* Mobile controls */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full text-fg transition-all hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-90"
            >
              {isLoading ? (
                <LoaderIcon className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>
            <IconButton label="Next track" onClick={next}>
              <SkipForwardIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  )
}
