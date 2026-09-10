/**
 * Page-driven audio cache fill.  The service worker never writes to the audio
 * cache (a waitUntil background fetch is throttled in some engines), so the
 * app fills it instead.  Every song load triggers a guarded, one-shot download
 * of the full file into `softyfy-audio`; the service worker picks it up on
 * subsequent plays and answers with instant byte-range slices.
 */

export const AUDIO_CACHE = 'softyfy-audio'
export const AUDIO_MAX_ENTRIES = 8
const CACHED_AT_HEADER = 'x-softyfy-cached-at'

const inflight = new Set<string>()

function isAudioUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.hostname === 'www.googleapis.com' &&
      u.pathname.startsWith('/drive/v3/files/') &&
      u.searchParams.get('alt') === 'media'
    )
  } catch {
    return false
  }
}

async function trimAudioCache(cache: Cache, keepUrl: string): Promise<void> {
  const entries = await cache.keys()
  const others = entries.filter((r) => r.url !== keepUrl)
  while (others.length >= AUDIO_MAX_ENTRIES) {
    const oldest = others.shift()
    if (!oldest) break
    await cache.delete(oldest)
  }
}

/**
 * Ensures the full audio file is stored in the Cache Storage so the service
 * worker can serve it without any further network requests.  Safe to call
 * multiple times for the same URL — only one download is initiated per unique
 * URL and already-cached entries are left untouched.
 */
export async function fillAudioCache(url: string): Promise<void> {
  if (typeof caches === 'undefined' || !isAudioUrl(url)) return
  if (inflight.has(url)) return
  inflight.add(url)

  try {
    const cache = await caches.open(AUDIO_CACHE)
    const key = new Request(url)
    if (await cache.match(key)) return

    const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) return

    const body = await response.arrayBuffer()
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'audio/mpeg')
    headers.set('Content-Length', String(body.byteLength))
    headers.set(CACHED_AT_HEADER, String(Date.now()))
    await cache.put(key, new Response(body, { status: 200, statusText: 'OK', headers }))
    await trimAudioCache(cache, url)
  } catch {
    // Network error or quota — playback continues from the network; the cache
    // will simply be filled on a future attempt.
  } finally {
    inflight.delete(url)
  }
}
