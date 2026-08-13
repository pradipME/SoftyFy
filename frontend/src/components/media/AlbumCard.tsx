import { Link } from 'react-router-dom'
import type { AlbumSummary } from '../../types/album'
import { AlbumArt } from '../album/AlbumArt'

interface AlbumCardProps {
  album: AlbumSummary
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      to={`/albums/${album.id}`}
      className="surface-card card-lift flex flex-col gap-3 p-4"
    >
      <AlbumArt title={album.title} className="aspect-square w-full rounded-xl" rounded="rounded-xl" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{album.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {album.artistName ?? 'Unknown artist'}
          {album.year ? ` · ${album.year}` : ''}
        </p>
      </div>
    </Link>
  )
}
