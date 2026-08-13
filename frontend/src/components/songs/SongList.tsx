import { formatDuration } from '../../lib/format'
import type { Song } from '../../types/song'
import type { SongSummary } from '../../types/song'
import { Badge } from '../ui/Badge'
import { ListMusicIcon, PlayIcon } from '../ui/icons'
import { AlbumArt } from '../album/AlbumArt'

interface SongListProps {
  songs: Song[]
  onAddToPlaylist?: (song: Song) => void
}

export function SongList({ songs, onAddToPlaylist }: SongListProps) {
  if (songs.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No songs yet.</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-elevated text-left text-xs uppercase tracking-wider text-dim">
            <th className="w-12 px-3 py-2.5 font-medium sm:px-4">#</th>
            <th className="px-3 py-2.5 font-medium sm:px-2">Title</th>
            <th className="hidden px-2 py-2.5 font-medium md:table-cell">Album</th>
            <th className="hidden px-2 py-2.5 font-medium sm:table-cell">Format</th>
            <th className="w-20 px-3 py-2.5 text-right font-medium sm:px-4">Time</th>
            {onAddToPlaylist ? <th className="w-12 px-2 py-2.5 font-medium sm:px-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => {
            const primaryFile = song.audioFiles.find((file) => file.primary) ?? song.audioFiles[0]
            return (
              <tr
                key={song.id}
                className="group border-b border-line/60 transition-colors last:border-b-0 hover:bg-elevated"
              >
                <td className="px-3 py-2.5 sm:px-4">
                  <span className="text-sm text-dim">{index + 1}</span>
                </td>
                <td className="px-3 py-2.5 sm:px-2">
                  <div className="flex items-center gap-3">
                    <AlbumArt title={song.title} className="h-10 w-10" rounded="rounded-md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{song.title}</p>
                      <p className="truncate text-xs text-muted">{song.artists.map((artist) => artist.name).join(', ') || 'Unknown artist'}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-2 py-2.5 text-sm text-muted md:table-cell">
                  {song.album?.title ?? '–'}
                </td>
                <td className="hidden px-2 py-2.5 sm:table-cell">
                  {primaryFile?.format ? <Badge>{primaryFile.format}</Badge> : <span className="text-xs text-dim">–</span>}
                </td>
                <td className="px-3 py-2.5 text-right text-sm text-muted sm:px-4">
                  {formatDuration(song.durationSeconds)}
                </td>
                {onAddToPlaylist ? (
                  <td className="px-2 py-2.5 sm:px-3">
                    <button
                      type="button"
                      onClick={() => onAddToPlaylist(song)}
                      title={`Add ${song.title} to a playlist`}
                      aria-label={`Add ${song.title} to a playlist`}
                      className="rounded-full p-2 text-dim transition-colors hover:bg-accent/15 hover:text-accent-strong"
                    >
                      <ListMusicIcon className="h-4 w-4" />
                    </button>
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface SongSummaryListProps {
  songs: SongSummary[]
  onRemove?: (songId: string) => void
  emptyLabel?: string
}

export function SongSummaryList({ songs, onRemove, emptyLabel = 'No songs yet.' }: SongSummaryListProps) {
  if (songs.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{emptyLabel}</p>
  }

  return (
    <div className="divide-y divide-line/60 rounded-xl border border-line">
      {songs.map((song, index) => (
        <div key={song.id} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-elevated sm:px-4">
          <span className="w-6 shrink-0 text-sm text-dim">{index + 1}</span>
          <AlbumArt title={song.title} className="h-10 w-10" rounded="rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{song.title}</p>
            <p className="truncate text-xs text-muted">{song.artistNames.join(', ') || 'Unknown artist'}</p>
          </div>
          {song.albumTitle ? <span className="hidden truncate text-sm text-muted md:block">{song.albumTitle}</span> : null}
          <span className="shrink-0 text-sm text-muted">{formatDuration(song.durationSeconds)}</span>
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(song.id)}
              aria-label={`Remove ${song.title}`}
              className="shrink-0 rounded-full p-1.5 text-dim hover:bg-danger/10 hover:text-danger"
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function SongPlayButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? 'Playback coming soon' : 'Play'}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-elevated disabled:text-dim"
    >
      <PlayIcon className="h-4 w-4" />
    </button>
  )
}
