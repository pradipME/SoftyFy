import { Link, useNavigate } from 'react-router-dom'
import { formatPlaybackTime } from '../player/format'
import { usePlayerApi, usePlayerState } from '../state/PlayerContext'
import { AlbumArt } from '../components/album/AlbumArt'
import { Button } from '../components/ui/Button'
import { QueueList } from '../components/player/QueueList'
import {
  ArrowLeftIcon,
  ListMusicIcon,
  LoaderIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from '../components/ui/icons'
import { SeekBar, toggleClass, VolumeControl } from '../components/player/controls'

export function NowPlayingPage() {
  const navigate = useNavigate()
  const state = usePlayerState()
  const api = usePlayerApi()
  const song = api.currentSong

  if (!song) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated text-dim">
            <MusicIcon className="h-8 w-8" />
          </span>
          <div>
            <p className="text-lg font-semibold">Nothing is playing</p>
            <p className="mt-1 text-sm text-muted">Pick a track from your library to get started.</p>
          </div>
          <Link to="/songs">
            <Button variant="secondary" className="mt-2">
              Browse your songs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isPlaying = state.status === 'playing'
  const isLoading = state.status === 'loading'
  const isError = state.status === 'error'
  const playToggleLabel = isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <AlbumArt
            title={song.title}
            className="aspect-square w-full rounded-2xl shadow-xl"
            rounded="rounded-2xl"
          />
          <div className="max-w-full text-center">
            <h1 className="truncate text-2xl font-bold tracking-tight">{song.title}</h1>
            <p className="mt-1 truncate text-sm text-muted">
              {song.artistNames.join(', ') || 'Unknown artist'}
            </p>
            {song.albumTitle ? (
              <p className="truncate text-sm text-dim">{song.albumTitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col gap-6">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={api.toggleShuffle}
              title={state.shuffleEnabled ? 'Turn shuffle off' : 'Turn shuffle on'}
              aria-label={state.shuffleEnabled ? 'Turn shuffle off' : 'Turn shuffle on'}
              className={toggleClass(state.shuffleEnabled)}
            >
              <ShuffleIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={api.previous}
              title="Previous track"
              aria-label="Previous track"
              className="rounded-full p-2 text-dim transition-colors hover:bg-elevated hover:text-fg"
            >
              <SkipBackIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={api.togglePlay}
              title={playToggleLabel}
              aria-label={playToggleLabel}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-fg text-elevated transition-colors hover:bg-accent hover:text-white"
            >
              {isLoading ? (
                <LoaderIcon className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>
            <button
              type="button"
              onClick={api.next}
              title="Next track"
              aria-label="Next track"
              className="rounded-full p-2 text-dim transition-colors hover:bg-elevated hover:text-fg"
            >
              <SkipForwardIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={api.cycleRepeat}
              title={
                state.repeatMode === 'off'
                  ? 'Repeat off — turn repeat on'
                  : state.repeatMode === 'all'
                    ? 'Repeat all — turn repeat on one'
                    : 'Repeat one — turn repeat off'
              }
              aria-label={
                state.repeatMode === 'off'
                  ? 'Repeat off'
                  : state.repeatMode === 'all'
                    ? 'Repeat all'
                    : 'Repeat one'
              }
              className={`relative ${toggleClass(state.repeatMode !== 'off')}`}
            >
              <RepeatIcon className="h-5 w-5" />
              {state.repeatMode === 'one' ? (
                <span className="absolute -right-0.5 -top-0.5 text-[10px] font-bold leading-none">
                  1
                </span>
              ) : null}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-dim">
              {formatPlaybackTime(state.currentTime)}
            </span>
            <div className="min-w-0 flex-1">
              <SeekBar />
            </div>
            <span className="w-10 shrink-0 text-xs tabular-nums text-dim">
              {formatPlaybackTime(state.duration)}
            </span>
          </div>

          {isError ? (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-center text-sm text-danger">
              {state.error ?? 'Unable to play this song.'}
            </p>
          ) : null}

          <div className="flex items-center justify-center">
            <VolumeControl />
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-2xl">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <ListMusicIcon className="h-5 w-5 text-dim" />
          Up next
        </h2>
        <div className="rounded-xl border border-line">
          <QueueList />
        </div>
      </section>
    </div>
  )
}
