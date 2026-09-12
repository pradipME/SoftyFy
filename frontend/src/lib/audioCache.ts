/**
 * Shared cache-layout constants used by the Service Worker (sw.ts), the
 * download store (downloads.ts) and the player's preloader (PlayerContext.tsx).
 * Keeping them in one module means a rename can never silently desync the
 * service worker from the page.
 */

/** Runtime audio cache: songs cached as they are first played. */
export const AUDIO_CACHE = 'softyfy-audio'
/** Explicit user downloads; entries live here forever (never pruned). */
export const DOWNLOADS_CACHE = 'so.softyfy-downloads'
export const AUDIO_MAX_ENTRIES = 8
export const AUDIO_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
export const CACHED_AT_HEADER = 'x-softyfy-cached-at'