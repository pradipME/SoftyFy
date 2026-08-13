import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState } from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { DiscIcon } from '../components/ui/icons'
import { useAlbums } from '../hooks/useAlbums'

const PAGE_SIZE = 24

export function AlbumsPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useAlbums(page, PAGE_SIZE)

  return (
    <>
      <PageHeader title="Albums" description="Full releases in your library." />

      {loading ? (
        <CardGridSkeleton cards={8} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data?.content.length === 0 ? (
        <EmptyState
          icon={<DiscIcon className="h-8 w-8" />}
          title="No albums yet"
          description="Albums appear here once your library has songs."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data?.content.map((album) => (
              <Link
                key={album.id}
                to={`/albums/${album.id}`}
                className="surface-card flex flex-col gap-3 p-4 transition-colors hover:border-accent/40"
              >
                <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-accent/40 to-accent-soft/30 text-4xl font-bold text-white">
                  {album.title.slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{album.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {album.artistName ?? 'Unknown artist'}
                    {album.year ? ` · ${album.year}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {data && data.totalPages > 0 ? (
            <Pagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={setPage}
              size={PAGE_SIZE}
            />
          ) : null}
        </>
      )}
    </>
  )
}
