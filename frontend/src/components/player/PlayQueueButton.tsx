import type { QueueItem } from '../../player/types'
import { usePlayerApi } from '../../state/PlayerContext'
import { LoaderIcon, PauseIcon, PlayIcon } from '../ui/icons'

interface PlayQueueButtonProps {
  song: QueueItem
  queue: QueueItem[]
  size?: 'sm' | 'md'
}

export function PlayQueueButton({ song, queue, size = 'sm' }: PlayQueueButtonProps) {
  const api = usePlayerApi()
  const isCurrent = api.currentSongId === song.id
  const isLoading = isCurrent && api.status === 'loading'
  const isPlaying = isCurrent && api.status === 'playing'

  const handleClick = () => {
    if (isCurrent && (isPlaying || isLoading)) {
      api.pause()
      return
    }
    const startIndex = queue.findIndex((item) => item.id === song.id)
    api.playSong(song, queue, startIndex >= 0 ? startIndex : 0)
  }

  const label = isPlaying ? `Pause ${song.title}` : `Play ${song.title}`
  const dimensions = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${dimensions}`}
    >
      {isLoading ? (
        <LoaderIcon className={`${iconSize} animate-spin`} />
      ) : isPlaying ? (
        <PauseIcon className={iconSize} />
      ) : (
        <PlayIcon className={iconSize} />
      )}
    </button>
  )
}
