import { useEffect, useRef } from 'react'
import { IconButton } from '../ui/IconButton'
import { CloseIcon, LoaderIcon } from '../ui/icons'

interface UpdateToastProps {
  needRefresh: boolean
  offlineReady: boolean
  updating: boolean
  onUpdate: () => void
  onDismiss: () => void
}

export function UpdateToast({ needRefresh, offlineReady, updating, onUpdate, onDismiss }: UpdateToastProps) {
  const updateButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!needRefresh) return

    const previousOverflow = document.body.style.overflow
    const appShell = document.querySelector('.sonic-shell')
    appShell?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'

    const focusUpdate = () => updateButtonRef.current?.focus()
    const frame = window.requestAnimationFrame(focusUpdate)
    const keepUpdateFocused = (event: KeyboardEvent) => {
      event.stopImmediatePropagation()
      if (event.key === 'Tab') {
        event.preventDefault()
        focusUpdate()
      } else if (event.key === 'Escape') {
        event.preventDefault()
      }
    }
    document.addEventListener('keydown', keepUpdateFocused, true)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', keepUpdateFocused, true)
      appShell?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
    }
  }, [needRefresh])

  if (needRefresh) {
    return (
      <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/85 px-5 py-8 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="required-update-title" aria-describedby="required-update-description" aria-busy={updating}>
        <div className="w-full max-w-md rounded-[28px] border border-[#665b35] bg-[#201e14] px-7 py-9 text-center shadow-[0_28px_100px_rgba(0,0,0,.72)] sm:px-10 sm:py-11">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[#d8c777]/15 text-[#e2d07e]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10" aria-hidden="true">
              <path d="M20 7v5h-5" />
              <path d="M4.8 9a8 8 0 0 1 13.5-2L20 12M4 12v5h5" />
              <path d="M5.7 17a8 8 0 0 0 13.5-2" />
            </svg>
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-[#d8c777]">Update required</p>
          <h1 id="required-update-title" className="text-2xl font-bold tracking-tight text-[#f0ead6] sm:text-3xl">Update SoftyFy to continue</h1>
          <p id="required-update-description" className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#c0b99f] sm:text-base">
            A new version is ready. Update the app before continuing to your music.
          </p>
          <button ref={updateButtonRef} type="button" className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-semibold text-black transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50" onClick={onUpdate} disabled={updating}>
            {updating ? <><LoaderIcon className="h-4 w-4 animate-spin" /> Updating…</> : 'Update now'}
          </button>
          <p className="mt-4 text-xs text-[#938d77]">This screen will close after the update reloads the app.</p>
        </div>
      </div>
    )
  }

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-40 z-50 flex justify-center px-4 md:bottom-24">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-elevated/95 py-2 pl-4 pr-2 shadow-lg shadow-black/40 backdrop-blur">
        <p className="text-sm text-fg">Ready to work offline</p>
        <IconButton size="sm" label="Dismiss" onClick={onDismiss}>
          <CloseIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}
