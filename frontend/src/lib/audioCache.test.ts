import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fillAudioCache } from './audioCache'

const AUDIO_URL =
  'https://www.googleapis.com/drive/v3/files/abc123?alt=media&key=TEST_KEY'
const NON_AUDIO_URL = 'https://example.com/file.mp3'

const mockCache = {
  match: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(true),
}

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.restoreAllMocks()
  mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    headers: { get: (h: string) => (h === 'Content-Type' ? 'audio/mpeg' : null) },
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(12345)),
  })
  vi.stubGlobal('fetch', mockFetch)
  vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(mockCache) })
  mockCache.match.mockResolvedValue(undefined)
  mockCache.put.mockResolvedValue(undefined)
  mockCache.keys.mockResolvedValue([])
  mockCache.delete.mockResolvedValue(true)
})

describe('fillAudioCache', () => {
  it('does nothing for a non-audio URL', async () => {
    await fillAudioCache(NON_AUDIO_URL)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips fetching when the cache already contains the entry', async () => {
    mockCache.match.mockResolvedValueOnce(new Response('hit'))
    await fillAudioCache(AUDIO_URL)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches and stores the file when the cache misses', async () => {
    await fillAudioCache(AUDIO_URL)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockCache.put).toHaveBeenCalledTimes(1)
    const [, response] = mockCache.put.mock.calls[0]
    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(200)

    const headers = Object.fromEntries(response.headers.entries())
    expect(headers['content-type']).toBe('audio/mpeg')
    expect(headers['x-softyfy-cached-at']).toBeDefined()
  })
})
