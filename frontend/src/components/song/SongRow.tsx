import { usePlayer } from '../../context/PlayerContext'
import type { Song } from '../../types/song'
import { PlayIcon } from '../ui/icons'
import { Cover } from './Cover'

interface SongRowProps {
  song: Song
  /** The list this row belongs to — becomes the playback queue. */
  queue: Song[]
}

export function SongRow({ song, queue }: SongRowProps) {
  const { currentSong, status, playSong, togglePlay } = usePlayer()
  const isCurrent = currentSong?.id === song.id
  const isPlaying = isCurrent && status === 'playing'

  const handleClick = () => {
    if (isCurrent) {
      togglePlay()
    } else {
      playSong(song, queue)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleClick()
        }
      }}
      className="group flex min-h-[56px] cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Cover src={song.coverSrc} alt={song.title} className="h-11 w-11 shrink-0 rounded" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isCurrent ? 'font-medium text-accent' : 'text-fg'}`}>
          {song.title}
        </p>
        <p className="truncate text-xs text-muted">{song.artist}</p>
      </div>
      {isCurrent ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-accent">
          {isPlaying ? <EqualizerBars /> : <PlayIcon className="h-4 w-4" />}
        </span>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-fg opacity-0 transition-opacity group-hover:opacity-100">
          <PlayIcon className="h-4 w-4" />
        </span>
      )}
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
        {formatDuration(song.durationSec)}
      </span>
    </div>
  )
}

function EqualizerBars() {
  return (
    <span className="flex h-3.5 items-end gap-0.5" aria-label="Playing">
      <span className="eq-bar h-full w-0.5 bg-accent" style={{ animationDelay: '0ms' }} />
      <span className="eq-bar h-full w-0.5 bg-accent" style={{ animationDelay: '180ms' }} />
      <span className="eq-bar h-full w-0.5 bg-accent" style={{ animationDelay: '360ms' }} />
    </span>
  )
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
