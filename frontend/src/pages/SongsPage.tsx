import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { SongList } from '../components/songs/SongList'
import { ErrorState } from '../components/ui/ErrorState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { PlaylistPickerModal } from '../components/playlists/PlaylistPickerModal'
import { useSongs } from '../hooks/useSongs'
import type { SongSortOption } from '../types/api'
import type { Song } from '../types/song'

const PAGE_SIZE = 25

const sortOptions: { value: SongSortOption; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'artist', label: 'Artist' },
  { value: 'album', label: 'Album' },
  { value: 'created', label: 'Recently added' },
]

export function SongsPage() {
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SongSortOption>('title')
  const [pickerSong, setPickerSong] = useState<Song | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { data, loading, error, reload } = useSongs(page, PAGE_SIZE, sort)

  return (
    <>
      <PageHeader
        title="Songs"
        description="All tracks in your library."
        actions={
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SongSortOption)
              setPage(0)
            }}
            aria-label="Sort songs"
            className="rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      {notice ? (
        <p className="mb-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <ListSkeleton rows={10} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          <SongList songs={data?.content ?? []} onAddToPlaylist={setPickerSong} />
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

      {pickerSong ? (
        <PlaylistPickerModal
          songTitle={pickerSong.title}
          songId={pickerSong.id}
          onClose={() => setPickerSong(null)}
          onAdded={(playlistName) => setNotice(`Added "${pickerSong.title}" to ${playlistName}`)}
        />
      ) : null}
    </>
  )
}
