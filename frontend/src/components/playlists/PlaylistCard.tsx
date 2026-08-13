import { Link } from 'react-router-dom'
import type { PlaylistSummary } from '../../types/playlist'
import { ListMusicIcon } from '../ui/icons'

interface PlaylistCardProps {
  playlist: PlaylistSummary
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link
      to={`/playlists/${playlist.id}`}
      className="surface-card flex flex-col gap-3 p-4 transition-colors hover:border-accent/40"
    >
      <div className="flex h-20 w-full items-center justify-center rounded-xl bg-gradient-to-br from-accent/30 to-accent-soft/20 text-accent-strong">
        <ListMusicIcon className="h-10 w-10" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{playlist.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
          {playlist.description ?? 'No description'}
        </p>
        <p className="mt-1.5 text-xs text-dim">
          {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </Link>
  )
}
