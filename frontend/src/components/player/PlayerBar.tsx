import { Link } from 'react-router-dom'
import { formatPlaybackTime } from '../../player/format'
import { usePlayerApi, usePlayerState } from '../../state/PlayerContext'
import { AlbumArt } from '../album/AlbumArt'
import { IconButton } from '../ui/IconButton'
import {
  ListMusicIcon,
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '../ui/icons'

interface PlayerBarProps {
  onOpenQueue: () => void
}

function toggleClass(active: boolean) {
  return `rounded-full p-2 transition-colors ${
    active ? 'text-accent-strong hover:bg-accent/10' : 'text-dim hover:bg-elevated hover:text-fg'
  }`
}

function SeekBar() {
  const { currentTime, duration } = usePlayerState()
  const { seek } = usePlayerApi()
  const max = Math.max(0, duration)
  const value = Math.min(currentTime, max)
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={1}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => seek(Number(event.target.value))}
      aria-label="Seek"
      className="h-1.5 w-full cursor-pointer accent-accent"
      disabled={max === 0}
    />
  )
}

function VolumeControl() {
  const { volume, isMuted } = usePlayerState()
  const { setVolume, toggleMute } = usePlayerApi()
  const effective = isMuted ? 0 : volume
  return (
    <div className="flex items-center gap-2">
      <IconButton label={isMuted ? 'Unmute' : 'Mute'} size="sm" onClick={toggleMute}>
        {isMuted || effective === 0 ? (
          <VolumeMuteIcon className="h-4 w-4" />
        ) : (
          <VolumeIcon className="h-4 w-4" />
        )}
      </IconButton>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(effective * 100)}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        aria-label="Volume"
        className="w-24 cursor-pointer accent-accent"
      />
    </div>
  )
}

export function PlayerBar({ onOpenQueue }: PlayerBarProps) {
  const state = usePlayerState()
  const api = usePlayerApi()
  const song = api.currentSong
  const hasSong = song !== null
  const isPlaying = state.status === 'playing'
  const isLoading = hasSong && state.status === 'loading'
  const isError = hasSong && state.status === 'error'

  const playToggleLabel = isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'

  return (
    <footer className="relative flex h-20 shrink-0 flex-col border-t border-line bg-surface">
      <div className="md:hidden">
        <SeekBar />
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to="/now-playing"
            aria-label={song ? `Now playing: ${song.title}` : 'Now playing'}
            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <AlbumArt title={song?.title ?? 'SoftyFy'} className="h-12 w-12" rounded="rounded-lg" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{song?.title ?? 'Nothing playing'}</p>
            <p className={`truncate text-xs ${isError ? 'text-danger' : 'text-dim'}`}>
              {isError
                ? state.error ?? 'Unable to play this song.'
                : isLoading
                  ? 'Loading…'
                  : song
                    ? song.artistNames.join(', ') || 'Unknown artist'
                    : 'Pick a track to start listening'}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <IconButton
            label={state.shuffleEnabled ? 'Turn shuffle off' : 'Turn shuffle on'}
            onClick={api.toggleShuffle}
            className={toggleClass(state.shuffleEnabled)}
          >
            <ShuffleIcon className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Previous track"
            onClick={api.previous}
            className="rounded-full p-2 text-dim transition-colors hover:bg-elevated hover:text-fg"
          >
            <SkipBackIcon className="h-5 w-5" />
          </IconButton>
          <button
            type="button"
            onClick={api.togglePlay}
            disabled={!hasSong}
            title={playToggleLabel}
            aria-label={playToggleLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-fg text-base text-elevated transition-colors hover:bg-accent hover:text-white disabled:opacity-40"
          >
            {isLoading ? (
              <LoaderIcon className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </button>
          <IconButton
            label="Next track"
            onClick={api.next}
            className="rounded-full p-2 text-dim transition-colors hover:bg-elevated hover:text-fg"
          >
            <SkipForwardIcon className="h-5 w-5" />
          </IconButton>
          <IconButton
            label={
              state.repeatMode === 'off'
                ? 'Repeat off — turn repeat on'
                : state.repeatMode === 'all'
                  ? 'Repeat all — turn repeat on one'
                  : 'Repeat one — turn repeat off'
            }
            onClick={api.cycleRepeat}
            className={toggleClass(state.repeatMode !== 'off')}
          >
            <span className="relative">
              <RepeatIcon className="h-4 w-4" />
              {state.repeatMode === 'one' ? (
                <span className="absolute -right-1.5 -top-1.5 text-[9px] font-bold leading-none">
                  1
                </span>
              ) : null}
            </span>
          </IconButton>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <IconButton
            label="Open queue"
            onClick={onOpenQueue}
            className="relative rounded-full p-2 text-dim transition-colors hover:bg-elevated hover:text-fg"
          >
            <ListMusicIcon className="h-5 w-5" />
            {state.queue.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {state.queue.length}
              </span>
            ) : null}
          </IconButton>
          <VolumeControl />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={api.togglePlay}
            disabled={!hasSong}
            title={playToggleLabel}
            aria-label={playToggleLabel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-fg text-base text-elevated transition-colors hover:bg-accent hover:text-white disabled:opacity-40"
          >
            {isLoading ? (
              <LoaderIcon className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </button>
          <IconButton label="Next track" onClick={api.next} className="rounded-full p-2 text-dim hover:text-fg">
            <SkipForwardIcon className="h-5 w-5" />
          </IconButton>
          <IconButton label="Open queue" onClick={onOpenQueue} className="relative rounded-full p-2 text-dim hover:text-fg">
            <ListMusicIcon className="h-5 w-5" />
            {state.queue.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {state.queue.length}
              </span>
            ) : null}
          </IconButton>
        </div>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <div className="min-w-0 flex-1" />
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 pb-2">
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-dim">
              {formatPlaybackTime(state.currentTime)}
            </span>
            <div className="min-w-0 flex-1">
              <SeekBar />
            </div>
            <span className="w-10 shrink-0 text-[11px] tabular-nums text-dim">
              {formatPlaybackTime(state.duration)}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1" />
      </div>
    </footer>
  )
}
