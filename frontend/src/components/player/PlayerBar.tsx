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

interface PlayerBarProps {
  onOpenSheet: () => void
}

/**
 * Floating frosted-glass mini player. Hovers just above the bottom nav with a
 * soft shadow and cover glow, so it reads as a layer above the ambient
 * background rather than a flat strip. Tap the song info to expand the sheet.
 */
export function PlayerBar({ onOpenSheet }: PlayerBarProps) {
  const {
    currentSong,
    status,
    currentTime,
    duration,
    shuffle,
    repeat,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer()

  if (currentSong === null) return null

  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'
  const isError = status === 'error'
  const total = duration > 0 ? duration : currentSong.durationSec
  const percent = total > 0 ? (Math.min(currentTime, total) / total) * 100 : 0

  const playLabel = isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-40 md:bottom-4 md:left-1/2 md:right-auto md:w-full md:max-w-2xl md:-translate-x-1/2">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-base/75 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-elevated/70">
          <div
            className="h-full bg-accent transition-[width] duration-300 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex h-16 items-center gap-2 px-2.5 sm:px-3">
          <button
            type="button"
            onClick={onOpenSheet}
            aria-label={`Now playing: ${currentSong.title} — tap to expand`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CoverGlow song={currentSong} inset="-inset-4" className="shrink-0">
              <Cover src={currentSong.coverSrc} alt={currentSong.title} className="h-12 w-12 rounded-xl" />
            </CoverGlow>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{currentSong.title}</p>
              <p className={`truncate text-xs ${isError ? 'text-danger' : 'text-muted'}`}>
                {isError ? 'Unable to play this song.' : currentSong.artist}
              </p>
            </div>
          </button>

          {/* Desktop controls */}
          <div className="hidden items-center gap-1 md:flex">
            <IconButton
              label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
              onClick={toggleShuffle}
              className={shuffle ? 'text-accent' : ''}
            >
              <ShuffleIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Previous track" onClick={previous}>
              <SkipBackIcon className="h-5 w-5" />
            </IconButton>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playLabel}
              className="mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-fg text-black transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
              className={repeat !== 'off' ? 'text-accent' : ''}
            >
              <span className="relative">
                <RepeatIcon className="h-4 w-4" />
                {repeat === 'one' ? (
                  <span className="absolute -right-1.5 -top-1.5 text-[9px] font-bold leading-none">1</span>
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
              className="flex h-11 w-11 items-center justify-center rounded-full text-fg transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
