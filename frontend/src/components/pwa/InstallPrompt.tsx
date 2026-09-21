import { useEffect, useState, useRef } from 'react'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { CloseIcon } from '../ui/icons'
import { safeStorage } from '../../lib/storage'

// Key for localStorage to remember when the user dismissed the banner.
const DISMISS_KEY = 'softyfy:installPromptDismissed'
// Dismissal expires after 7 days.
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000
// How long to wait after the event (or iOS detection) before showing the banner.
const SHOW_DELAY_MS = 12_000 // 12 seconds

/**
 * Small, unobtrusive toast that invites the user to install the PWA.
 *
 * - Listens for the `beforeinstallprompt` event on Android/Chrome, prevents
 *   the default mini‑infobar and stores the event.
 * - After a short delay (≈12 s) a bottom‑aligned banner appears with an "Install"
 *   button. Tapping it triggers the stored prompt().
 * - On iOS (where `beforeinstallprompt` never fires) we show a static instruction
 *   banner: "Tap Share → Add to Home Screen".
 * - The banner is not shown if the app is already running in standalone mode.
 * - Dismissal is remembered in localStorage for 7 days to avoid nagging.
 */
export function InstallPrompt() {
  // The event captured from `beforeinstallprompt`. May be null on iOS.
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null)
  // Whether the UI should be visible.
  const [show, setShow] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storage = safeStorage()

  // Detect if the app is already installed / running as a PWA.
   const isStandalone =
     typeof window !== 'undefined' &&
     ((typeof (window as any).matchMedia === 'function' &&
       (window as any).matchMedia('(display-mode: standalone)')?.matches) ||
       // Safari iOS sets navigator.standalone when launched from Home Screen.
       // TypeScript does not have this property on Navigator, so we cast.
       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
       // @ts-ignore
       navigator.standalone)

  // Simple iOS detection via userAgent (good enough for the prompt).
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)

  // Determine whether the user has dismissed the banner recently.
  const isDismissed = (() => {
    if (!storage) return false
    const ts = storage.getItem(DISMISS_KEY)
    if (!ts) return false
    const t = Number(ts)
    return !Number.isNaN(t) && Date.now() - t < DISMISS_DURATION_MS
  })()

  // Listen for the beforeinstallprompt event (Android/Chrome).
  useEffect(() => {
    if (isStandalone) return
    const handler = (e: Event) => {
      // Prevent the default mini‑infobar.
      e.preventDefault()
      setDeferredPrompt(e as any)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [isStandalone])

  // After we have a prompt (or we are on iOS) and the user hasn't dismissed,
  // schedule the toast to appear after a short delay.
  useEffect(() => {
    if (isStandalone || isDismissed) return
    // For Android we wait for the captured event; for iOS we wait regardless.
    if (deferredPrompt || isIOS) {
      timerRef.current = setTimeout(() => setShow(true), SHOW_DELAY_MS)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [deferredPrompt, isIOS, isDismissed, isStandalone])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    // The promise resolves with the user's choice.
    try {
      await deferredPrompt.userChoice
    } catch {
      // Some browsers may not support userChoice; ignore.
    }
    // Hide the banner regardless of outcome.
    setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    if (storage) {
      storage.setItem(DISMISS_KEY, Date.now().toString())
    }
  }

  // Do not render anything if the app is already installed or the toast is hidden.
  if (isStandalone || !show) return null

  const message = isIOS ? 'Tap Share → Add to Home Screen' : 'Install SoftyFy for a better experience'
  const installButton = isIOS ? null : (
    <Button size="sm" variant="primary" onClick={handleInstall}>
      Install
    </Button>
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-40 z-50 flex justify-center px-4 md:bottom-24">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-elevated/95 py-2 pl-4 pr-2 shadow-lg shadow-black/40 backdrop-blur">
        <p className="text-sm text-fg">{message}</p>
        {installButton}
        <IconButton size="sm" label="Dismiss install prompt" onClick={handleDismiss}>
          <CloseIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}
