import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState } from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { UsersIcon } from '../components/ui/icons'
import { useArtists } from '../hooks/useArtists'

const PAGE_SIZE = 24

export function ArtistsPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useArtists(page, PAGE_SIZE)

  return (
    <>
      <PageHeader title="Artists" description="Everyone in your library." />

      {loading ? (
        <CardGridSkeleton cards={8} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data?.content.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-8 w-8" />}
          title="No artists yet"
          description="Artists appear here once your library has songs."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data?.content.map((artist) => (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="surface-card flex flex-col items-center gap-3 p-5 text-center transition-colors hover:border-accent/40"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-2xl font-semibold text-white">
                  {artist.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{artist.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
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
