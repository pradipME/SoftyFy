import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { CreatePlaylistPayload, PatchPlaylistPayload } from '../../api/playlists'

interface PlaylistFormModalProps {
  mode: 'create' | 'edit'
  initialName?: string
  initialDescription?: string | null
  title: string
  onClose: () => void
  onSubmit: (payload: CreatePlaylistPayload | PatchPlaylistPayload) => Promise<void>
}

export function PlaylistFormModal({
  mode,
  initialName = '',
  initialDescription = null,
  title,
  onClose,
  onSubmit,
}: PlaylistFormModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setName(initialName)
    setDescription(initialDescription ?? '')
  }, [initialName, initialDescription])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Playlist name is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload =
        mode === 'create'
          ? { name: trimmed, description: description.trim() || null }
          : { name: trimmed, description: description.trim() || null }
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the playlist.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My playlist"
          autoFocus
          error={error ?? undefined}
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this playlist about?"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create playlist' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
