import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { CloseIcon } from '../ui/icons'

interface UpdateToastProps {
  needRefresh: boolean
  offlineReady: boolean
  onUpdate: () => void
  onDismiss: () => void
}

/**
 * Small, unobtrusive bottom toast that asks the user to update or confirms
 * offline readiness. Sits just above the PlayerBar / BottomNav and does not
 * block playback controls.
 */
export function UpdateToast({ needRefresh, offlineReady, onUpdate, onDismiss }: UpdateToastProps) {
  if (!needRefresh && !offlineReady) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-40 z-50 flex justify-center px-4 md:bottom-24">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-elevated/95 py-2 pl-4 pr-2 shadow-lg shadow-black/40 backdrop-blur">
        {needRefresh ? (
          <>
            <p className="text-sm text-fg">New version available</p>
            <Button size="sm" variant="primary" onClick={onUpdate}>
              Update
            </Button>
            <IconButton size="sm" label="Dismiss update prompt" onClick={onDismiss}>
              <CloseIcon className="h-4 w-4" />
            </IconButton>
          </>
        ) : (
          <>
            <p className="text-sm text-fg">Ready to work offline</p>
            <IconButton size="sm" label="Dismiss" onClick={onDismiss}>
              <CloseIcon className="h-4 w-4" />
            </IconButton>
          </>
        )}
      </div>
    </div>
  )
}