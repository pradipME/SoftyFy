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
  clients?: { claim: () => Promise<void> }
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

function hostAndPath(rawUrl: string): { hostname: string; pathname: string } {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { hostname: '', pathname: '' }
  }
  return { hostname: url.hostname, pathname: url.pathname }
}

// ── Covers ───────────────────────────────────────────────────────────────────
// Cached on first sight (they load as no-cors <img> requests, so entries may be
// opaque — that is fine to cache and serve back unchanged).
const COVER_CACHE = 'softyfy-covers'

function isCoverUrl(rawUrl: string): boolean {
  const { hostname, pathname } = hostAndPath(rawUrl)
  return hostname === 'drive.google.com' && pathname.startsWith('/thumbnail')
}

async function handleCover(request: Request): Promise<Response> {
  const cache = await caches.open(COVER_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.status !== 0 && !response.ok) return response

  try {
    await cache.put(request, response.clone())
  } catch {
    // Opaque/quota — keep serving from the network.
  }
  return response
}

// Audio streams through the Drive API. On a cache miss the response is passed
// through UNCHANGED (streaming — playback starts immediately), while the full
// file is copied into the cache in the background. Every later play, seek and
// re-open is served from the cache as a proper byte-range slice. Capping the
// cache keeps mobile storage usage in check.
const AUDIO_CACHE = 'softyfy-audio'
const AUDIO_MAX_ENTRIES = 8
const AUDIO_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
const CACHED_AT_HEADER = 'x-softyfy-cached-at'

function isAudioUrl(rawUrl: string): boolean {
  const url = new URL(rawUrl)
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

// Copies a fresh response's body into the cache without blocking playback.
// Runs on a separate reading branch (clone), so serving the original response
// to the media element is unaffected and playback starts immediately.
async function cacheAudioInBackground(response: Response, key: Request): Promise<void> {
  try {
    const cache = await caches.open(AUDIO_CACHE)
    const body = await response.arrayBuffer()
    const full = new Response(body, {
      status: 200,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    })
    full.headers.set(CACHED_AT_HEADER, String(Date.now()))
    await cache.put(key, full)
    await trimAudioCache(cache, key.url)
  } catch {
    // Aborted / quota — playback continues; this entry just stays uncached.
  }
}

async function handleAudio(
  request: Request,
  track: (promise: Promise<unknown>) => void,
): Promise<Response> {
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

  // Only the initial whole-file request builds the cache entry; mid-stream seek
  // requests (which carry a real Range) must keep streaming through untouched.
  const isInitial = !rangeHeader || rangeHeader.trim() === 'bytes=0-'
  if (isInitial) track(cacheAudioInBackground(response.clone(), key))

  return response
}

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as unknown as FetchEventLike
  const { method, url } = fetchEvent.request
  if (method !== 'GET') return
  if (isAudioUrl(url)) {
    fetchEvent.respondWith(
      handleAudio(fetchEvent.request, (p) => fetchEvent.waitUntil(p)).catch(() =>
        fetch(fetchEvent.request),
      ),
    )
  } else if (isCoverUrl(url)) {
    fetchEvent.respondWith(handleCover(fetchEvent.request).catch(() => fetch(fetchEvent.request)))
  }
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