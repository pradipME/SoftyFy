import { usePlayer } from '../../context/PlayerContext'
import type { Song } from '../../types/song'
import { PlayIcon } from '../ui/icons'
import { Cover } from './Cover'
import { formatPlaybackTime } from '../../lib/format'

interface SongRowProps {
  song: Song
  /** The list this row belongs to — becomes the playback queue. */
  queue: Song[]
  /** Optional index number to display */
  index?: number
}

export function SongRow({ song, queue, index }: SongRowProps) {
  const { currentSong, status, playSong, togglePlay } = usePlayer()
  const isCurrent = currentSong?.id === song.id
  const isPlaying = isCurrent && status === 'playing'
  const isLoading = isCurrent && status === 'loading'

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
      className={`group flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isCurrent ? 'song-row-active' : ''
      }`}
    >
      {/* Track number / play indicator */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        {isCurrent ? (
          isLoading ? (
            <span className="flex h-5 w-5 items-center justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </span>
          ) : isPlaying ? (
            <EqualizerBars />
          ) : (
            <PlayIcon className="h-4 w-4 text-accent" />
          )
        ) : (
          <>
            {index !== undefined ? (
              <span className="text-sm tabular-nums text-muted transition-opacity group-hover:opacity-0">
                {index + 1}
              </span>
            ) : null}
            <PlayIcon className={`h-4 w-4 text-fg ${index !== undefined ? 'absolute opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
          </>
        )}
      </div>

      {/* Cover + info */}
      <Cover src={song.coverSrc} alt={song.title} className="h-11 w-11 shrink-0 rounded-lg shadow" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isCurrent ? 'text-accent' : 'text-fg'}`}>
          {song.title}
        </p>
        <p className="truncate text-xs text-muted">{song.artist}</p>
        {song.album ? (
          <p className="truncate text-[11px] text-dim">{song.album}</p>
        ) : null}
      </div>

      {/* Duration */}
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
        {formatDuration(song.durationSec)}
      </span>
    </div>
  )
}

function EqualizerBars() {
  return (
    <span className="flex h-4 items-end gap-px" aria-label="Playing">
      <span className="eq-bar h-full w-0.5 rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
      <span className="eq-bar h-full w-0.5 rounded-full bg-accent" style={{ animationDelay: '160ms' }} />
      <span className="eq-bar h-full w-0.5 rounded-full bg-accent" style={{ animationDelay: '320ms' }} />
      <span className="eq-bar h-full w-0.5 rounded-full bg-accent" style={{ animationDelay: '80ms' }} />
    </span>
  )
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  return formatPlaybackTime(seconds)
}
