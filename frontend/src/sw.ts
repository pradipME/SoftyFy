import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import {
  AUDIO_CACHE,
  AUDIO_MAX_AGE_MS,
  AUDIO_MAX_ENTRIES,
  CACHED_AT_HEADER,
  DOWNLOADS_CACHE,
} from './lib/audioCache'

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

// URLs still being read by the page (a media element mid-stream). Never evicted
// mid-play by another song's trim, so a Range request that arrives a moment
// later still finds its file in cache instead of re-buffering from the network.
const activeUrls = new Set<string>()

function markActive(url: string): void {
  activeUrls.add(url)
  // Safety valve: only consulted during eviction, and treating an old URL as
  // inactive merely relaxes the guard. Keep the set bounded.
  if (activeUrls.size > 48) activeUrls.clear()
}

// In-flight background cache-fills keyed by request URL. Any new fill cancels
// every older fill for a *different* URL, so a rapid skip stops the previous
// song's full ~8 MB copy from downloading and competing with the track that is
// actually playing. Multiple initial requests for the SAME url collapse into
// one fill (no duplicate downloads).
const fills = new Map<string, { controller: AbortController }>()

function abortFill(url: string): void {
  const fill = fills.get(url)
  if (fill) {
    fill.controller.abort()
    fills.delete(url)
  }
}

function isAbortError(err: unknown): boolean {
  return typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError'
}

/**
 * Reads the body to completion so it can be re-stored as a plain 200 response.
 * Honours `signal`: once aborted (the user skipped on), the read stops and the
 * network branch for the clone is released so bandwidth frees up immediately.
 */
async function readFullBody(
  response: Response,
  signal: AbortSignal,
): Promise<ArrayBuffer | null> {
  const body = response.body
  if (body === null) return null
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    if (signal.aborted) {
      await reader.cancel().catch(() => {})
      return null
    }
    let result
    try {
      result = await reader.read()
    } catch (err) {
      if (isAbortError(err)) return null
      throw err
    }
    if (result.done) break
    const value = result.value
    chunks.push(value)
    total += value.byteLength
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged.buffer as ArrayBuffer
}

async function trimAudioCache(cache: Cache, keepUrl: string): Promise<void> {
  const entries = await cache.keys()
  const evictable = entries.filter((request) => {
    if (request.url === keepUrl) return false
    // Don't evict a song that the page is still actively streaming: its next
    // Range request would otherwise miss and re-download mid-play.
    if (activeUrls.has(request.url)) return false
    return true
  })
  while (evictable.length >= AUDIO_MAX_ENTRIES) {
    const oldest = evictable.shift()
    if (!oldest) break
    await cache.delete(oldest)
  }
}

async function cacheAudioInBackground(
  response: Response,
  key: Request,
  signal: AbortSignal,
): Promise<void> {
  const url = key.url
  try {
    // Some hosts answer audio URLs with an HTML interstitial in place of the
    // file (e.g. a Drive virus-scan page). Never cache those — playback still
    // streams, but the cache must not ever serve HTML as audio.
    const contentType = (response.headers.get('Content-Type') || '').toLowerCase()
    if (!/^audio\/|^application\/octet-stream/.test(contentType)) return

    const body = await readFullBody(response, signal)
    if (body === null) return // aborted — the user skipped on; nothing to store

    const cache = await caches.open(AUDIO_CACHE)
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'audio/mpeg')
    headers.set('Content-Length', String(body.byteLength))
    headers.set(CACHED_AT_HEADER, String(Date.now()))
    await cache.put(key, new Response(body, { status: 200, statusText: 'OK', headers }))
    await trimAudioCache(cache, url)
  } catch {
    // Aborted / quota / stream error — playback continues; this entry just stays uncached.
  } finally {
    const entry = fills.get(url)
    if (entry && entry.controller.signal === signal) fills.delete(url)
  }
}

/** Tracks the one active fill for a fresh (initial) response and returns it. */
function startBackgroundFill(response: Response, key: Request): void {
  const url = key.url
  // A new track started: stop every older song's background copy so the active
  // stream no longer shares bandwidth with a full-file download nobody needs.
  for (const [otherUrl] of fills) {
    if (otherUrl !== url) abortFill(otherUrl)
  }
  // Already filling this exact URL (media element re-issued `bytes=0-`) —
  // don't clone a second 8 MB download.
  if (fills.has(url)) return

  const controller = new AbortController()
  fills.set(url, { controller })
  const copy = response.clone()
  void cacheAudioInBackground(copy, key, controller.signal)
}

/**
 * Streams the response to the page through a manual ReadableStream pump. If
 * the page abandons the stream (skip / src change aborts the media fetch),
 * the `cancel` hook aborts the matching background fill. The clone for the
 * cache is taken *before* this wrapper, so streaming to the page and caching
 * in the background never conflict.
 */
function withCancelAbort(response: Response, url: string): Response {
  markActive(url)
  const body = response.body
  if (body === null) return response

  const reader = body.getReader()
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
        } else {
          controller.enqueue(value)
        }
      } catch (error) {
        controller.error(error)
      }
    },
    cancel() {
      activeUrls.delete(url)
      abortFill(url)
      void reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
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
  const rangeHeader = request.headers.get('Range')
  const key = new Request(request.url)
  const url = key.url

  // Explicit user downloads take precedence: the entry lives in its own cache
  // (never pruned by the runtime audio cache) so an offline play of a saved
  // song resolves here even when the network is gone.
  const downloadCache = await caches.open(DOWNLOADS_CACHE)
  const downloaded = await downloadCache.match(key)
  if (downloaded && downloaded.ok) {
    markActive(url)
    const body = await downloaded.arrayBuffer()
    return buildRangeResponse(
      body,
      downloaded.headers.get('Content-Type') || 'audio/mpeg',
      rangeHeader,
    )
  }

  const cache = await caches.open(AUDIO_CACHE)
  const cached = await cache.match(key)
  if (cached && cached.ok) {
    const at = Number(cached.headers.get(CACHED_AT_HEADER) || 0)
    if (Date.now() - at < AUDIO_MAX_AGE_MS) {
      markActive(url)
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

  // Cache the full file in the background for instant repeat plays. The clone
  // is taken BEFORE the response is handed to the page — cloning after
  // handover throws on an already-consumed body and silently kills caching.
  const isInitial = !rangeHeader || rangeHeader.trim() === 'bytes=0-'
  if (isInitial) {
    startBackgroundFill(response, key)
    return withCancelAbort(response, url)
  }
  markActive(url)
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