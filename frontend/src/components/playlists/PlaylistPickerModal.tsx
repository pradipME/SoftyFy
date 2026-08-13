import { useState } from 'react'
import { addSongsToPlaylist, fetchPlaylists } from '../../api/playlists'
import { useAsync } from '../../hooks/useAsync'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { ListMusicIcon, PlusIcon } from '../ui/icons'

interface PlaylistPickerModalProps {
  songTitle: string
  songId: string
  onClose: () => void
  onAdded: (playlistName: string) => void
}

export function PlaylistPickerModal({ songTitle, songId, onClose, onAdded }: PlaylistPickerModalProps) {
  const { data, loading } = useAsync(() => fetchPlaylists(0, 50), [])
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const playlists = data?.content ?? []

  const handleAdd = async (playlistId: string) => {
    setAdding(playlistId)
    setError(null)
    try {
      const playlist = playlists.find((item) => item.id === playlistId)
      if (!playlist) throw new Error('Playlist not found.')
      await addSongsToPlaylist(playlistId, [songId])
      onAdded(playlist.name)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the song.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Modal title={`Add "${songTitle}" to a playlist`} onClose={onClose}>
      <div className="flex flex-col gap-1">
        {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
        {loading ? (
          <ListSkeleton rows={5} />
        ) : playlists.length === 0 ? (
          <EmptyState
            icon={<ListMusicIcon className="h-8 w-8" />}
            title="No playlists"
            description="Create a playlist first, then add songs to it."
          />
        ) : (
          playlists.map((playlist) => (
            <div key={playlist.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-elevated">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{playlist.name}</p>
                <p className="truncate text-xs text-muted">
                  {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAdd(playlist.id)}
                disabled={adding === playlist.id}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {adding === playlist.id ? 'Adding…' : 'Add'}
              </Button>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
