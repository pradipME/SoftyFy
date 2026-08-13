import { Link } from 'react-router-dom'
import type { ArtistListItem } from '../../types/artist'
import { initials } from '../../lib/format'

interface ArtistCardProps {
  artist: ArtistListItem
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      to={`/artists/${artist.id}`}
      className="surface-card card-lift flex flex-col items-center gap-3 p-5 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-2xl font-semibold text-white">
        {initials(artist.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{artist.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </Link>
  )
}
