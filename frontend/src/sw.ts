import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

interface FetchEventLike {
  request: Request
  respondWith: (promise: Promise<Response>) => void
}

interface ExtendableEventLike {
  waitUntil: (promise: Promise<unknown>) => void
}

declare let self: {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>
  addEventListener: (type: string, listener: (event: Event) => void) => void
  skipWaiting: () => void
  clients?: { claim: () => Promise<void> }
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Covers are cached on first sight and served instantly afterwards.
registerRoute(
  ({ url }) => url.hostname === 'drive.google.com' && url.pathname.startsWith('/thumbnail'),
  new CacheFirst({
    cacheName: 'softyfy-covers',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

// Audio streams through the Drive API. The FULL file is cached (kept as a
// single 200 response) the first time it is played; every later play, seek and
// re-open is served from the cache as a proper byte-range slice. Capping the
// cache keeps mobile storage usage in check.
const AUDIO_CACHE = 'softyfy-audio'
const AUDIO_MAX_ENTRIES = 8
const AUDIO_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
const CACHED_AT_HEADER = 'x-softyfy-cached-at'

function isAudioUrl(rawUrl: string): boolean {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }
  return (
    url.hostname === 'www.googleapis.com' &&
    url.pathname.startsWith('/drive/v3/files/') &&
    url.searchParams.get('alt') === 'media'
  )
}

async function trimAudioCache(cache: Cache, keepUrl: string): Promise<void> {
  // Cache#keys() returns entries in insertion order, so dropping from the front
  // evicts the least recently used track first.
  const entries = await cache.keys()
  const others = entries.filter((r) => r.url !== keepUrl)
  while (others.length >= AUDIO_MAX_ENTRIES) {
    const oldest = others.shift()
    if (!oldest) break
    await cache.delete(oldest)
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

  const response = await fetch(key, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) return response

  const body = await response.arrayBuffer()
  const full = new Response(body, {
    status: 200,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  })
  full.headers.set(CACHED_AT_HEADER, String(Date.now()))

  try {
    await cache.put(key, full.clone())
    await trimAudioCache(cache, key.url)
  } catch {
    // Quota or aborted — keep playing anyway.
  }

  return buildRangeResponse(body, response.headers.get('Content-Type') || 'audio/mpeg', rangeHeader)
}

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as unknown as FetchEventLike
  if (fetchEvent.request.method !== 'GET' || !isAudioUrl(fetchEvent.request.url)) return
  fetchEvent.respondWith(handleAudio(fetchEvent.request).catch(() => fetch(fetchEvent.request)))
})

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  const activateEvent = event as unknown as ExtendableEventLike
  activateEvent.waitUntil(self.clients ? self.clients.claim() : Promise.resolve())
})

self.addEventListener('message', (event) => {
  const data = (event as MessageEvent).data as { type?: string } | undefined
  if (data && data.type === 'SKIP_WAITING') self.skipWaiting()
})