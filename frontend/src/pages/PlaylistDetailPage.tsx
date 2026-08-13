import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deletePlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  updatePlaylist,
} from '../api/playlists'
import type { CreatePlaylistPayload, PatchPlaylistPayload } from '../api/playlists'
import { usePlaylist } from '../hooks/usePlaylists'
import { songSummaryToQueueItem } from '../lib/toQueueItem'
import { usePlayerApi } from '../state/PlayerContext'
import { ErrorState } from '../components/ui/ErrorState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { IconButton } from '../components/ui/IconButton'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  ListMusicIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from '../components/ui/icons'
import { PlayQueueButton } from '../components/player/PlayQueueButton'
import { PlaylistFormModal } from '../components/playlists/PlaylistFormModal'
import { SongPickerModal } from '../components/playlists/SongPickerModal'
import type { SongSummary } from '../types/song'

export function PlaylistDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = usePlaylist(id)
  const playerApi = usePlayerApi()

  const [songs, setSongs] = useState<SongSummary[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setSongs(data?.songs ?? [])
  }, [data])

  const persistOrder = async (nextSongs: SongSummary[]) => {
    setSongs(nextSongs)
    setActionError(null)
    try {
      await reorderPlaylistSongs(id, nextSongs.map((song) => song.id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reorder the playlist.')
      reload()
    }
  }

  const moveSong = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= songs.length) return
    const next = [...songs]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    void persistOrder(next)
  }

  const removeSong = async (songId: string) => {
    setActionError(null)
    try {
      await removeSongFromPlaylist(id, songId)
      setSongs((current) => current.filter((song) => song.id !== songId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove the song.')
    }
  }

  const handleAddSongs = async (song: SongSummary) => {
    setSongs((current) => [...current, song])
    void reload()
  }

  const handleDelete = async () => {
    await deletePlaylist(id)
    navigate('/playlists')
  }

  const handleEdit = async (payload: CreatePlaylistPayload | PatchPlaylistPayload) => {
    await updatePlaylist(id, payload)
    reload()
  }

  if (loading) {
    return <ListSkeleton rows={8} />
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/playlists" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to playlists
        </Link>
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  const queue = songs.map(songSummaryToQueueItem)

  return (
    <div className="flex flex-col gap-8">
      <Link to="/playlists" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to playlists
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/40 to-accent-soft/30 text-accent-strong">
            <ListMusicIcon className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {data.description || 'No description'}
            </p>
            <p className="mt-1 text-xs text-dim">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={songs.length === 0}
            onClick={() => {
              const queue = songs.map(songSummaryToQueueItem)
              if (queue.length > 0) playerApi.playSong(queue[0], queue, 0)
            }}
          >
            <PlayIcon className="h-4 w-4" />
            Play
          </Button>
          <Button variant="secondary" onClick={() => setPickerOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add songs
          </Button>
          <IconButton label="Edit playlist" variant="secondary" onClick={() => setEditOpen(true)}>
            <EditIcon className="h-5 w-5" />
          </IconButton>
          <IconButton label="Delete playlist" variant="danger" onClick={() => setDeleteOpen(true)}>
            <TrashIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </header>

      {actionError ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {actionError}
        </p>
      ) : null}

      {songs.length === 0 ? (
        <EmptyState
          icon={<ListMusicIcon className="h-8 w-8" />}
          title="This playlist is empty"
          description="Add songs to get started."
          action={
            <Button onClick={() => setPickerOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              Add songs
            </Button>
          }
        />
      ) : (
        <section>
          <div className="overflow-hidden rounded-xl border border-line">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-3 border-b border-line/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-elevated sm:px-4"
              >
                <span className="w-6 shrink-0 text-sm text-dim">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{song.title}</p>
                  <p className="truncate text-xs text-muted">{song.artistNames.join(', ') || 'Unknown artist'}</p>
                </div>
                <PlayQueueButton
                  song={queue[index]}
                  queue={queue}
                />
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label={`Move ${song.title} up`}
                    size="sm"
                    onClick={() => moveSong(index, -1)}
                    disabled={index === 0}
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={`Move ${song.title} down`}
                    size="sm"
                    onClick={() => moveSong(index, 1)}
                    disabled={index === songs.length - 1}
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={`Remove ${song.title}`}
                    size="sm"
                    variant="danger"
                    onClick={() => removeSong(song.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {editOpen ? (
        <PlaylistFormModal
          mode="edit"
          title="Edit playlist"
          initialName={data.name}
          initialDescription={data.description}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEdit}
        />
      ) : null}

      {pickerOpen ? (
        <SongPickerModal playlistId={id} onClose={() => setPickerOpen(false)} onAdded={handleAddSongs} />
      ) : null}

      {deleteOpen ? (
        <Modal title="Delete playlist" onClose={() => setDeleteOpen(false)}>
          <p className="text-sm text-muted">
            Are you sure you want to delete <span className="font-semibold text-fg">{data.name}</span>?
            This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
