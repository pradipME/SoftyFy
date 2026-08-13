import { usePlayerApi, usePlayerState } from '../../state/PlayerContext'
import { formatPlaybackTime } from '../../player/format'
import { AlbumArt } from '../album/AlbumArt'
import { IconButton } from '../ui/IconButton'
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '../ui/icons'

interface QueueRowProps {
  songId: string
  title: string
  artistNames: string[]
  durationSeconds: number | null
  position: number
  isCurrent: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}

function QueueRow({
  songId,
  title,
  artistNames,
  durationSeconds,
  position,
  isCurrent,
  canMoveUp,
  canMoveDown,
}: QueueRowProps) {
  const api = usePlayerApi()

  return (
    <li
      className={`flex items-center gap-3 px-3 py-2 transition-colors hover:bg-elevated sm:px-4 ${
        isCurrent ? 'bg-accent/5' : ''
      }`}
    >
      <span className={`w-5 shrink-0 text-right text-xs ${isCurrent ? 'text-accent-strong' : 'text-dim'}`}>
        {position + 1}
      </span>
      <AlbumArt title={title} className="h-9 w-9" rounded="rounded-md" />
      <button
        type="button"
        onClick={() => api.playAt(position)}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
        aria-label={isCurrent ? `Playing ${title}` : `Play ${title}`}
      >
        <p
          className={`flex items-center gap-2 truncate text-sm ${
            isCurrent ? 'font-semibold text-accent-strong' : 'font-medium text-fg'
          }`}
        >
          {title}
          {isCurrent ? (
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-strong" aria-hidden="true" />
          ) : null}
        </p>
        <p className="truncate text-xs text-muted">{artistNames.join(', ') || 'Unknown artist'}</p>
      </button>
      <span className="shrink-0 text-xs text-dim">
        {durationSeconds != null ? formatPlaybackTime(durationSeconds) : '–'}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton
          label={`Move ${title} up in queue`}
          size="sm"
          onClick={() => api.reorderQueue(position, position - 1)}
          disabled={!canMoveUp}
        >
          <ChevronUpIcon className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={`Move ${title} down in queue`}
          size="sm"
          onClick={() => api.reorderQueue(position, position + 1)}
          disabled={!canMoveDown}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={`Remove ${title} from queue`}
          size="sm"
          variant="danger"
          onClick={() => api.removeFromQueue(songId)}
        >
          <TrashIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </li>
  )
}

export function QueueList() {
  const state = usePlayerState()
  const api = usePlayerApi()
  const queue = state.playOrder.map((index) => state.queue[index])

  if (queue.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">The queue is empty.</p>
  }

  return (
    <ol className="divide-y divide-line/60">
      {queue.map((item, position) => (
        <QueueRow
          key={item.id}
          songId={item.id}
          title={item.title}
          artistNames={item.artistNames}
          durationSeconds={item.durationSeconds}
          position={position}
          isCurrent={item.id === api.currentSongId}
          canMoveUp={position > 0}
          canMoveDown={position < queue.length - 1}
        />
      ))}
    </ol>
  )
}
