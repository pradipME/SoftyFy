import { useMemo, useState } from 'react'
import { addSongsToPlaylist } from '../../api/playlists'
import { fetchSongs } from '../../api/songs'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { MusicIcon, PlusIcon } from '../ui/icons'
import type { SongSummary } from '../../types/song'

interface SongPickerModalProps {
  playlistId: string
  onClose: () => void
  onAdded: (song: SongSummary) => void
}

export function SongPickerModal({ playlistId, onClose, onAdded }: SongPickerModalProps) {
  const { data, loading } = useAsync(() => fetchSongs({ page: 0, size: 100 }), [playlistId])
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebouncedValue(query.trim().toLowerCase(), 200)

  const songs = useMemo(() => {
    const all = data?.content ?? []
    if (!debouncedQuery) return all
    return all.filter((song) => {
      const titleMatch = song.title.toLowerCase().includes(debouncedQuery)
      const artistMatch = song.artists.some((artist) => artist.name.toLowerCase().includes(debouncedQuery))
      return titleMatch || artistMatch
    })
  }, [data, debouncedQuery])

  const handleAdd = async (songId: string) => {
    setAdding(songId)
    setError(null)
    try {
      const song = songs.find((item) => item.id === songId)
      if (!song) throw new Error('Song not found.')
      await addSongsToPlaylist(playlistId, [songId])
      onAdded({
        id: song.id,
        title: song.title,
        durationSeconds: song.durationSeconds,
        artistNames: song.artists.map((artist) => artist.name),
        albumId: song.album?.id ?? null,
        albumTitle: song.album?.title ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the song.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Modal title="Add songs to playlist" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter songs…"
          autoFocus
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {loading ? (
            <ListSkeleton rows={6} />
          ) : songs.length === 0 ? (
            <EmptyState
              icon={<MusicIcon className="h-8 w-8" />}
              title="No songs found"
              description="Try a different filter, or add songs to your library first."
            />
          ) : (
            songs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-elevated">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{song.title}</p>
                  <p className="truncate text-xs text-muted">
                    {song.artists.map((artist) => artist.name).join(', ') || 'Unknown artist'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAdd(song.id)}
                  disabled={adding === song.id}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {adding === song.id ? 'Adding…' : 'Add'}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
