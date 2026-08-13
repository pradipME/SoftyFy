import { usePlayerState } from '../../state/PlayerContext'
import { MusicIcon, PauseIcon, SkipBackIcon, SkipForwardIcon } from '../ui/icons'

const disabledControlClass =
  'rounded-full p-2.5 text-dim transition-colors disabled:cursor-not-allowed disabled:opacity-60'

export function PlayerBar() {
  const { status, currentTrack } = usePlayerState()

  return (
    <footer className="flex h-20 shrink-0 items-center gap-4 border-t border-line bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-elevated text-dim">
          <MusicIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">
            {currentTrack?.title ?? 'Nothing playing'}
          </p>
          <p className="truncate text-xs text-dim">
            {currentTrack ? currentTrack.artistNames.join(', ') : 'Playback is coming soon'}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <button type="button" disabled className={disabledControlClass} aria-label="Previous track">
          <SkipBackIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled
          className="flex h-11 w-11 items-center justify-center rounded-full bg-fg text-base text-elevated disabled:opacity-40"
          aria-label={status === 'idle' ? 'Play' : 'Pause'}
        >
          <PauseIcon className="h-5 w-5" />
        </button>
        <button type="button" disabled className={disabledControlClass} aria-label="Next track">
          <SkipForwardIcon className="h-5 w-5" />
        </button>
      </div>

      <p className="hidden flex-1 justify-end text-xs text-dim md:flex">
        Playback disabled in this version
      </p>
    </footer>
  )
}
