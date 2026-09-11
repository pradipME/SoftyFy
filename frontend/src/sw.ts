import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

interface FetchEventLike {
  request: Request
  respondWith: (promise: Promise<Response>) => void
  waitUntil: (promise: Promise<unknown>) => void
}

interface ExtendableEventLike {
  waitUntil: (promise: Promise<unknown>) => void
}

declare let self: {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>
  addEventListener: (type: string, listener: (event: Event) => void) => void
  skipWaiting: () => void
  clients?: { claim: () => Promise<void>; matchAll: () => Promise<Array<{ postMessage: (m: unknown) => void }>> }
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ── Covers ───────────────────────────────────────────────────────────────────
// No longer intercepted by the service worker. Drive thumbnails were being
// cached as opaque/empty bodies by older SW versions and served forever as
// broken images. Letting the browser's normal HTTP cache fetch them directly
// (the same path local/dev uses) is more reliable, and `activate` below purges
// any legacy cover-cache entries.

// ── Audio ────────────────────────────────────────────────────────────────────
const AUDIO_CACHE = 'softyfy-audio'
const AUDIO_MAX_ENTRIES = 8
const AUDIO_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
const CACHED_AT_HEADER = 'x-softyfy-cached-at'

function isAudioUrl(rawUrl: string): boolean {
  const url = new URL(rawUrl)
  if (
    url.hostname === 'www.googleapis.com' &&
    url.pathname.startsWith('/drive/v3/files/') &&
    url.searchParams.get('alt') === 'media'
  ) {
    return true
  }
  // Fallback hosts the player switches to when the Drive API URL drops.
  if (url.hostname === 'drive.usercontent.google.com' && url.pathname.startsWith('/download')) {
    return true
  }
  if (url.hostname === 'drive.google.com' && url.pathname.startsWith('/uc')) {
    return true
  }
  return false
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

async function cacheAudioInBackground(response: Response, key: Request): Promise<void> {
  try {
    // Some hosts answer audio URLs with an HTML interstitial in place of the
    // file (e.g. a Drive virus-scan page). Never cache those — playback still
    // streams, but the cache must not ever serve HTML as audio.
    const contentType = (response.headers.get('Content-Type') || '').toLowerCase()
    if (!/^audio\/|^application\/octet-stream/.test(contentType)) return

    const cache = await caches.open(AUDIO_CACHE)
    const body = await response.arrayBuffer()
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'audio/mpeg')
    headers.set('Content-Length', String(body.byteLength))
    headers.set(CACHED_AT_HEADER, String(Date.now()))
    await cache.put(key, new Response(body, { status: 200, statusText: 'OK', headers }))
    await trimAudioCache(cache, key.url)
  } catch {
    // Aborted / quota — playback continues; this entry just stays uncached.
  }
}

// Builds the byte-range response (200 full, 206 slice, or 416) from the file's
// full body. Media elements ask with `Range`, so answering exact slices keeps
// seeking correct whether the file came from the cache or a fresh fetch.
function buildRangeResponse(
  body: ArrayBuffer,
  mimeType: string,
  rangeHeader: string | null,
): Response {
  const total = body.byteLength
  const base: Record<string, string> = {
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
  }

  if (!rangeHeader) {
    return new Response(body, {
      status: 200,
      headers: { ...base, 'Content-Length': String(total) },
    })
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match) {
    return new Response(body, {
      status: 200,
      headers: { ...base, 'Content-Length': String(total) },
    })
  }

  let start: number
  let end: number
  if (match[1] === '') {
    const suffix = Number(match[2])
    start = Math.max(total - suffix, 0)
    end = total - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? total - 1 : Math.min(Number(match[2]), total - 1)
  }

  if (start > end || start >= total) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } })
  }

  const slice = body.slice(start, end + 1)
  return new Response(slice, {
    status: 206,
    headers: {
      ...base,
      'Content-Length': String(slice.byteLength),
      'Content-Range': `bytes ${start}-${end}/${total}`,
    },
  })
}

async function handleAudio(request: Request): Promise<Response> {
  const cache = await caches.open(AUDIO_CACHE)
  const key = new Request(request.url)
  const rangeHeader = request.headers.get('Range')

  const cached = await cache.match(key)
  if (cached && cached.ok) {
    const at = Number(cached.headers.get(CACHED_AT_HEADER) || 0)
    if (Date.now() - at < AUDIO_MAX_AGE_MS) {
      const body = await cached.arrayBuffer()
      return buildRangeResponse(
        body,
        cached.headers.get('Content-Type') || 'audio/mpeg',
        rangeHeader,
      )
    }
    void cache.delete(key)
  }

  // Forward the original request (Range header included) so Google answers
  // with true byte-range semantics. Before this fix every miss returned a
  // full 200 which snapped the media timeline back ("can't drag ahead").
  const response = await fetch(request, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) return response

  // Cache the full file in the background for instant repeat plays.
  const isInitial = !rangeHeader || rangeHeader.trim() === 'bytes=0-'
  if (isInitial) {
    const copy = response.clone()
    void cacheAudioInBackground(copy, key)
  }

  return response
}

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as unknown as FetchEventLike
  const { method, url } = fetchEvent.request
  if (method !== 'GET') return
  if (isAudioUrl(url)) {
    fetchEvent.respondWith(handleAudio(fetchEvent.request).catch(() => fetch(fetchEvent.request)))
  }
})

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  const activateEvent = event as unknown as ExtendableEventLike
  activateEvent.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((name) => name.startsWith('softyfy-covers'))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => (self.clients ? self.clients.claim() : Promise.resolve())),
  )
})

self.addEventListener('message', (event) => {
  const data = (event as MessageEvent).data as { type?: string } | undefined
  if (data && data.type === 'SKIP_WAITING') self.skipWaiting()
})
