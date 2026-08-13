import { useState } from 'react'
import { createPlaylist } from '../api/playlists'
import type { CreatePlaylistPayload } from '../api/playlists'
import { usePlaylists } from '../hooks/usePlaylists'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState } from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { ListMusicIcon, PlusIcon } from '../components/ui/icons'
import { PlaylistCard } from '../components/playlists/PlaylistCard'
import { PlaylistFormModal } from '../components/playlists/PlaylistFormModal'

const PAGE_SIZE = 24

export function PlaylistsPage() {
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const { data, loading, error, reload } = usePlaylists(page, PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="Playlists"
        description="Your own collections of songs."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            New playlist
          </Button>
        }
      />

      {loading ? (
        <CardGridSkeleton cards={8} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data?.content.length === 0 ? (
        <EmptyState
          icon={<ListMusicIcon className="h-8 w-8" />}
          title="No playlists yet"
          description="Create your first playlist to start collecting songs."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New playlist
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data?.content.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
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

      {createOpen ? (
        <PlaylistFormModal
          mode="create"
          title="New playlist"
          onClose={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            await createPlaylist(payload as CreatePlaylistPayload)
            reload()
          }}
        />
      ) : null}
    </>
  )
}
