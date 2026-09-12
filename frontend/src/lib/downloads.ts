import { useEffect, useMemo, useReducer } from 'react'
import type { Song } from '../types/song'
import { buildAudioCandidates } from './audioSources'
import { DOWNLOADS_CACHE } from './audioCache'

const STORE_KEY = 'so.softyfy.downloads'

export { DOWNLOADS_CACHE }

type DownloadsMap = Record<string, string>

const listeners = new Set<() => void>()
/** In-flight downloads keyed by song id, so rapid taps share one task. */
const inFlight = new Map<string, Promise<void>>()

function read(): DownloadsMap {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as DownloadsMap) : {}
  } catch {
    return {}
  }
}

function write(map: DownloadsMap): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map))
  } catch {
    // Storage unavailable — the app still streams normally.
  }
}

function notify(): void {
  listeners.forEach((fn) => fn())
}

function isAudioResponse(response: Response): boolean {
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  return /^audio\/|^application\/octet-stream/.test(contentType)
}

export function isDownloaded(songId: string): boolean {
  return songId in read()
}

export function isDownloading(songId: string): boolean {
  return inFlight.has(songId)
}

export function downloadedSongIds(): string[] {
  return Object.keys(read())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function downloadSong(song: Song): Promise<void> {
  const running = inFlight.get(song.id)
  if (running) return running

  const task = (async () => {
    const candidates = buildAudioCandidates(song.audioSrc)
    for (const url of candidates) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok || !isAudioResponse(res)) continue
        const cache = await caches.open(DOWNLOADS_CACHE)
        await cache.put(url, res.clone())
        const map = read()
        map[song.id] = url
        write(map)
        notify()
        return
      } catch {
        // Try the next host — matches the playback fallback order.
      } finally {
        clearTimeout(timer)
      }
    }
    throw new Error(`Cannot download "${song.title}"`)
  })()

  const tracked = task.finally(() => inFlight.delete(song.id))
  inFlight.set(song.id, tracked)
  return tracked
}

export async function removeDownload(song: Song): Promise<void> {
  if (inFlight.has(song.id)) return
  const map = read()
  const url = map[song.id]
  if (url) {
    try {
      const cache = await caches.open(DOWNLOADS_CACHE)
      await cache.delete(url)
    } catch {
      // Cache already gone — nothing to clean up.
    }
  }
  delete map[song.id]
  write(map)
  notify()
}

/** Reactive snapshot of the download store for components. */
export function useDownloads(): { downloadedIds: string[] } {
  const [, refresh] = useReducer((x: number) => x + 1, 0)
  useEffect(() => subscribe(refresh), [])
  return useMemo(() => ({ downloadedIds: downloadedSongIds() }), [refresh])
}