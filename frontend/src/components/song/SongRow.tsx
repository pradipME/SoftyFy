import { usePlayer } from '../../context/PlayerContext'
import type { Song } from '../../types/song'
import { formatPlaybackTime } from '../../lib/format'
import { PlayIcon } from '../ui/icons'
import { Cover } from './Cover'

interface SongRowProps {
  song: Song
  /** The list this row belongs to — becomes the playback queue. */
  queue: Song[]
  index?: number
}

export function SongRow({ song, queue, index }: SongRowProps) {
  const { currentSong, status, playSong, togglePlay } = usePlayer()
  const isCurrent = currentSong?.id === song.id
  const isPlaying = isCurrent && status === 'playing'
  const isLoading = isCurrent && status === 'loading'

  const handleClick = () => isCurrent ? togglePlay() : playSong(song, queue)

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
      aria-label={`${isCurrent ? (isPlaying ? 'Pause' : 'Play') : 'Play'} ${song.title} by ${song.artist}`}
      className={`sonic-song-row${isCurrent ? ' is-current' : ''}`}
    >
      <span className="sonic-track-play" aria-hidden="true">
        {isCurrent ? (
          isLoading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-accent border-t-transparent" /> :
            isPlaying ? <EqualizerBars /> : <PlayIcon />
        ) : index !== undefined ? <><span className="sonic-track-index">{index + 1}</span><PlayIcon className="sonic-row-hover-play" /></> : <PlayIcon />}
      </span>
      <Cover src={song.coverSrc} alt="" className="sonic-track-cover" />
      <span className="sonic-track-main">
        <strong>{song.title}</strong>
        <span>{song.artist}</span>
      </span>
      <span className="sonic-track-album">{song.album || song.library}</span>
      <span className="sonic-track-duration">{formatDuration(song.durationSec)}</span>
    </div>
  )
}

function EqualizerBars() {
  return (
    <span className="flex h-3.5 items-end gap-0.5" aria-label="Playing">
      {[0, 1, 2, 3].map((i) => <span key={i} className="eq-bar h-full w-0.5 rounded-full bg-accent" style={{ animationDelay: `${i * 90}ms` }} />)}
    </span>
  )
}

function formatDuration(seconds: number): string {
  return !Number.isFinite(seconds) || seconds <= 0 ? '' : formatPlaybackTime(seconds)
}
