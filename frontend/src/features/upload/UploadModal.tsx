import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  isSupportedAudioFile,
  isWithinSizeLimit,
  uploadAudioFile,
  type UploadResult,
} from '../../api/upload'

type UploadStatus = 'pending' | 'uploading' | 'success' | 'alreadyExists' | 'error'

interface UploadItem {
  id: string
  file: File
  status: UploadStatus
  progress: number
  message: string | null
}

interface UploadModalProps {
  onClose: () => void
  onUploaded?: (result: UploadResult) => void
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  pending: 'Waiting',
  uploading: 'Uploading',
  success: 'Imported',
  alreadyExists: 'Already in library',
  error: 'Failed',
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const abortRef = useRef<AbortController | null>(null)

  const patchItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const uploadItem = async (item: UploadItem) => {
    const controller = new AbortController()
    abortRef.current = controller
    patchItem(item.id, { status: 'uploading', progress: 0, message: null })
    try {
      const result = await uploadAudioFile(
        item.file,
        {
          title: title.trim() || undefined,
          artist: artist.trim() || undefined,
          album: album.trim() || undefined,
        },
        (progress) => {
          const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0
          patchItem(item.id, { progress: percent })
        },
        controller.signal,
      )
      patchItem(item.id, {
        status: result.created ? 'success' : 'alreadyExists',
        progress: 100,
        message: result.song.title,
      })
      onUploaded?.(result)
    } catch (error) {
      if (isAbortError(error)) {
        patchItem(item.id, { status: 'pending', progress: 0, message: null })
        return
      }
      patchItem(item.id, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed.',
      })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const accepted: File[] = []
    const rejected: string[] = []
    for (const file of Array.from(files)) {
      if (!isSupportedAudioFile(file)) {
        rejected.push(`${file.name} — unsupported format`)
      } else if (!isWithinSizeLimit(file)) {
        rejected.push(`${file.name} — exceeds the 200 MB limit`)
      } else {
        accepted.push(file)
      }
    }
    const newItems = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      progress: 0,
      message: null,
    }))
    if (newItems.length === 0) {
      setNotice(rejected.join('\n') || 'Select at least one audio file.')
      return
    }
    setNotice(rejected.length > 0 ? rejected.join('\n') : null)
    setItems((prev) => [...prev, ...newItems])
    for (const item of newItems) {
      queueRef.current = queueRef.current.then(() => uploadItem(item))
    }
  }

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    handleFiles(event.dataTransfer.files)
  }

  const cancelCurrent = () => {
    abortRef.current?.abort()
  }

  const clearFinished = () => {
    setItems((prev) => prev.filter((item) => item.status === 'pending' || item.status === 'uploading'))
  }

  const finishedCount = items.filter((item) => item.status === 'success' || item.status === 'alreadyExists').length
  const hasQueued = items.some((item) => item.status === 'pending' || item.status === 'uploading')

  return (
    <Modal title="Add music" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Title (optional)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Override the tag title"
          />
          <Input
            label="Artist (optional)"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Override the artist"
          />
          <Input
            label="Album (optional)"
            value={album}
            onChange={(event) => setAlbum(event.target.value)}
            placeholder="Override the album"
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-elevated px-6 py-10 text-sm text-muted transition-colors hover:border-accent/40 hover:text-fg"
        >
          <span className="text-base font-medium">Choose audio files or drop them here</span>
          <span className="text-xs text-dim">MP3, FLAC, WAV, M4A or OGG · up to 200 MB each</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.flac,.wav,.m4a,.ogg,audio/mpeg,audio/flac,audio/wav,audio/mp4,audio/ogg"
          multiple
          className="hidden"
          onChange={handleSelect}
        />

        {notice ? <p className="whitespace-pre-line text-xs text-danger">{notice}</p> : null}

        {items.length > 0 ? (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg border border-line bg-elevated px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{item.file.name}</p>
                  <p className="truncate text-xs text-dim">
                    {STATUS_LABELS[item.status]}
                    {item.message ? ` · ${item.message}` : ''}
                    {item.status === 'uploading' ? ` · ${item.progress}%` : ''}
                  </p>
                </div>
                {item.status === 'uploading' ? (
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}
                {item.status === 'error' ? <span className="h-2 w-2 rounded-full bg-danger" /> : null}
                {item.status === 'success' ? <span className="h-2 w-2 rounded-full bg-success" /> : null}
                {item.status === 'alreadyExists' ? <span className="h-2 w-2 rounded-full bg-warning" /> : null}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-xs text-muted">
            {finishedCount} imported
            {hasQueued ? ' · uploading…' : ''}
          </p>
          <div className="flex gap-2">
            {hasQueued ? (
              <Button variant="ghost" onClick={cancelCurrent}>
                Cancel upload
              </Button>
            ) : finishedCount > 0 ? (
              <Button variant="ghost" onClick={clearFinished}>
                Clear finished
              </Button>
            ) : null}
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
