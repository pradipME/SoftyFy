import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { CardGridSkeleton, ListSkeleton } from '../components/ui/Skeleton'
import { useArtist } from '../hooks/useArtists'
import { ArrowLeftIcon } from '../components/ui/icons'
import { SongSummaryList } from '../components/songs/SongList'

export function ArtistDetailPage() {
  const { id = '' } = useParams()
  const { data, loading, error, reload } = useArtist(id)

  return (
    <div className="flex flex-col gap-8">
      <Link to="/artists" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to artists
      </Link>

      {loading ? (
        <CardGridSkeleton cards={4} />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          <header className="flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-4xl font-bold text-white">
              {data.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {data.songs.length} {data.songs.length === 1 ? 'song' : 'songs'}
                {data.albums.length > 0
                  ? ` · ${data.albums.length} ${data.albums.length === 1 ? 'album' : 'albums'}`
                  : ''}
              </p>
            </div>
          </header>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Albums</h2>
            {data.albums.length === 0 ? (
              <p className="text-sm text-muted">No albums yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {data.albums.map((album) => (
                  <Link
                    key={album.id}
                    to={`/albums/${album.id}`}
                    className="surface-card flex flex-col gap-3 p-4 transition-colors hover:border-accent/40"
                  >
                    <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-accent/40 to-accent-soft/30 text-3xl font-bold text-white">
                      {album.title.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{album.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{album.year ?? ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Songs</h2>
            {data.songs.length === 0 ? (
              <p className="text-sm text-muted">No songs yet.</p>
            ) : (
              <SongSummaryList songs={data.songs} emptyLabel="No songs yet." />
            )}
          </section>
        </>
      )}
    </div>
  )
}

export function ArtistDetailSkeleton() {
  return <ListSkeleton rows={6} />
}
