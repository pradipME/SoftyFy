import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { useAlbum } from '../hooks/useAlbums'
import { ArrowLeftIcon } from '../components/ui/icons'
import { SongSummaryList } from '../components/songs/SongList'
import { Badge } from '../components/ui/Badge'

export function AlbumDetailPage() {
  const { id = '' } = useParams()
  const { data, loading, error, reload } = useAlbum(id)

  return (
    <div className="flex flex-col gap-8">
      <Link to="/albums" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to albums
      </Link>

      {loading ? (
        <ListSkeleton rows={8} />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          <header className="flex flex-wrap items-center gap-5">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/50 to-accent-soft/40 text-5xl font-bold text-white shadow-lg">
              {data.title.slice(0, 3).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                {data.artistId ? (
                  <Link to={`/artists/${data.artistId}`} className="hover:text-accent-strong">
                    {data.artistName}
                  </Link>
                ) : (
                  <span>Unknown artist</span>
                )}
                {data.year ? <Badge>{data.year}</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted">
                {data.songs.length} {data.songs.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </header>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Tracks</h2>
            <SongSummaryList songs={data.songs} emptyLabel="This album has no tracks yet." />
          </section>
        </>
      )}
    </div>
  )
}
