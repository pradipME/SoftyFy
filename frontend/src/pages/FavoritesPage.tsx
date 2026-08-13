import { useState } from 'react'
import { removeFavorite } from '../api/favorites'
import { useFavorites } from '../hooks/useFavorites'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState } from '../components/ui/ErrorState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { HeartIcon } from '../components/ui/icons'
import { SongSummaryList } from '../components/songs/SongList'

const PAGE_SIZE = 25

export function FavoritesPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useFavorites(page, PAGE_SIZE)

  const handleRemove = async (songId: string) => {
    await removeFavorite(songId)
    reload()
  }

  return (
    <>
      <PageHeader title="Favorites" description="The songs you love most." />

      {loading ? (
        <ListSkeleton rows={10} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data?.content.length === 0 ? (
        <EmptyState
          icon={<HeartIcon className="h-8 w-8" />}
          title="No favorites yet"
          description="Favorited songs will appear here."
        />
      ) : (
        <>
          <SongSummaryList
            songs={data?.content.map((favorite) => favorite.song) ?? []}
            onRemove={handleRemove}
            emptyLabel="No favorites yet."
          />
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
