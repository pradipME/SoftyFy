import { usePlayerApi, usePlayerState } from '../../state/PlayerContext'
import { formatPlaybackTime } from '../../player/format'
import { AlbumArt } from '../album/AlbumArt'
import { IconButton } from '../ui/IconButton'
import { ChevronDownIcon, ChevronUpIcon, ListMusicIcon, TrashIcon } from '../ui/icons'

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

function SectionHeader({ children }: { children: string }) {
  return (
    <li aria-hidden="true" className="px-3 pb-1 pt-3 text-[0.7rem] font-semibold uppercase tracking-wider text-dim sm:px-4">
      {children}
    </li>
  )
}

export function QueueList() {
  const state = usePlayerState()
  const api = usePlayerApi()
  const queue = state.playOrder.map((index) => state.queue[index])

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-dim">
          <ListMusicIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold">The queue is empty</p>
          <p className="mt-1 text-xs text-muted">Play a track and it will appear here.</p>
        </div>
      </div>
    )
  }

  const currentPosition = queue.findIndex((item) => item.id === api.currentSongId)

  return (
    <ol className="divide-y divide-line/60">
      {currentPosition >= 0 ? <SectionHeader>Now playing</SectionHeader> : null}
      {currentPosition >= 0 ? (
        <QueueRow
          songId={queue[currentPosition].id}
          title={queue[currentPosition].title}
          artistNames={queue[currentPosition].artistNames}
          durationSeconds={queue[currentPosition].durationSeconds}
          position={currentPosition}
          isCurrent
          canMoveUp={currentPosition > 0}
          canMoveDown={currentPosition < queue.length - 1}
        />
      ) : null}
      {currentPosition < queue.length - 1 ? <SectionHeader>Up next</SectionHeader> : null}
      {queue.map((item, position) => {
        if (position <= currentPosition) return null
        return (
          <QueueRow
            key={item.id}
            songId={item.id}
            title={item.title}
            artistNames={item.artistNames}
            durationSeconds={item.durationSeconds}
            position={position}
            isCurrent={false}
            canMoveUp={position > 0}
            canMoveDown={position < queue.length - 1}
          />
        )
      })}
    </ol>
  )
}
