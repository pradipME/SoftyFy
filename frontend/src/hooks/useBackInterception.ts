import { useCallback, useEffect, useRef } from 'react'

/**
 * Integrates a locally-controlled overlay (bottom sheet / dialog) with the
 * browser/Android Back button and the History API.
 *
 * While `open`, a lightweight History API entry is parked on top of the current
 * hash route. Pressing Back pops only that entry — closing the overlay and
 * leaving the router's own navigation intact. Closing the overlay through its
 * own controls pops the same entry, so the back stack never accumulates stale
 * overlay entries. Back therefore behaves like a native music app: dismiss the
 * overlay first, then keep walking the app's hash routes, and only exit when
 * there is genuinely nowhere left to go.
 *
 * The entry uses the current URL (no hash change), so react-router's
 * HashRouter sees an unchanged location and does not re-navigate when the
 * marker is pushed or popped.
 */
export function useBackInterception(open: boolean, onClose: () => void) {
  const markerActiveRef = useRef(false)

  // Open: park a marker on top of the history stack so Back pops the overlay
  // first instead of leaving/backing out of the app.
  useEffect(() => {
    if (!open || markerActiveRef.current) return
    window.history.pushState({ softyfyOverlay: true }, '')
    markerActiveRef.current = true
  }, [open])

  // Back press: the browser just popped our marker — dismiss the overlay only.
  const handlePopState = useCallback(() => {
    if (!markerActiveRef.current) return
    markerActiveRef.current = false
    onClose()
  }, [onClose])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  // Close through the overlay's own UI: remove the marker so the stack stays
  // balanced (no infinite history growth) and Back keeps working on the routes
  // below.
  useEffect(() => {
    if (open || !markerActiveRef.current) return
    markerActiveRef.current = false
    window.history.back()
  }, [open])
}
