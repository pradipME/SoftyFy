import type { ApiError } from '../../api/client'
import { Button } from './Button'

interface ErrorStateProps {
  error: ApiError | null
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const detail = error?.detail ?? 'Something went wrong while loading this content.'
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-6 py-14 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-2xl text-danger"
        aria-hidden="true"
      >
        !
      </div>
      <h3 className="text-lg font-semibold">Could not load this content</h3>
      <p className="max-w-sm text-sm text-muted">{detail}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      ) : null}
    </div>
  )
}
