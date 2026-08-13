import { useEffect } from 'react'
import { usePlayerApi, usePlayerState } from '../../state/PlayerContext'
import { IconButton } from '../ui/IconButton'
import { CloseIcon, TrashIcon } from '../ui/icons'
import { QueueList } from './QueueList'

interface QueueDrawerProps {
  open: boolean
  onClose: () => void
}

export function QueueDrawer({ open, onClose }: QueueDrawerProps) {
  const api = usePlayerApi()
  const queueLength = usePlayerState().queue.length

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Playback queue"
        className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 sm:bottom-20 sm:top-auto sm:h-2/3 sm:rounded-l-2xl ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold">
            Queue
            {queueLength > 0 ? (
              <span className="ml-2 text-sm font-normal text-dim">
                {queueLength} {queueLength === 1 ? 'track' : 'tracks'}
              </span>
            ) : null}
          </h2>
          <div className="flex items-center gap-1">
            <IconButton
              label="Clear queue"
              size="sm"
              variant="danger"
              onClick={() => api.clearQueue()}
              disabled={queueLength === 0}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Close queue" size="sm" onClick={onClose}>
              <CloseIcon className="h-4 w-4" />
            </IconButton>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QueueList />
        </div>
      </aside>
    </div>
  )
}
