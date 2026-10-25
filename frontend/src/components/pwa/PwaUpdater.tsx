import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { usePlayer } from '../../context/PlayerContext'
import { UpdateToast } from './UpdateToast'

/**
 * Registers the PWA service worker and drives the "update available" prompt.
 *
 * The SW is registered with `immediate: true` so that a fresh visit (no
 * previous SW) goes straight through without a redundant prompt. When a new
 * version of the SW is found the browser puts it into "waiting"; our custom
 * sw.ts never calls `skipWaiting()` on install (only in response to the
 * `SKIP_WAITING` message that `updateSW()` sends), so an open tab stays on
 * the current version until the user taps "Update".
 *
 * Already-open tabs can miss an update because Chromium only checks the SW
 * script for changes on load and then ~every 24 h. Two low-cost fixes:
 *   - `navigator.serviceWorker.getRegistration().update()` every 10 minutes
 *     interval covers long-lived sessions.
 *   - Re-probe on `visibilitychange → visible` so the banner appears
 *     shortly after the user switches back to the tab.
 */
const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000

export function PwaUpdater() {
  const { status, togglePlay } = usePlayer()
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updating, setUpdating] = useState(false)
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (needRefresh && status === 'playing') togglePlay()
  }, [needRefresh, status, togglePlay])

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => {
        setOfflineReady(true)
        offlineTimerRef.current = setTimeout(() => setOfflineReady(false), 5000)
      },
    })
    updateSWRef.current = updateSW

    const probe = () => {
      navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {})
    }
    const interval = window.setInterval(probe, UPDATE_CHECK_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') probe()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (offlineTimerRef.current !== null) clearTimeout(offlineTimerRef.current)
    }
  }, [])

  const applyUpdate = () => {
    const updateSW = updateSWRef.current
    if (!updateSW || updating) return

    setUpdating(true)
    void updateSW(true).catch(() => setUpdating(false))
  }

  return (
    <UpdateToast
      needRefresh={needRefresh}
      offlineReady={offlineReady}
      updating={updating}
      onUpdate={applyUpdate}
      onDismiss={() => setNeedRefresh(false)}
    />
  )
}
