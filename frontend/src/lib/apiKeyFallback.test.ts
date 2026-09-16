// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithKeyFallback, swapApiKey } from './apiKeyFallback'

const PRIMARY_KEY = 'AIzaSyAxAkYvJVFy_5HXwvejOlMi0yno613rtK8'
const BACKUP_KEY = 'AIzaSyDJQOBTOSYvirZGDLjDOSEssJHx5e_BXDk'
const MEDIA_URL = `https://www.googleapis.com/drive/v3/files/AB12?alt=media&key=${PRIMARY_KEY}`

function driveResponse(status: number): Response {
  return new Response(null, { status })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('swapApiKey', () => {
  it('replaces the key param and keeps the rest of the URL intact', () => {
    expect(swapApiKey(MEDIA_URL, BACKUP_KEY)).toBe(
      `https://www.googleapis.com/drive/v3/files/AB12?alt=media&key=${BACKUP_KEY}`,
    )
  })
})

describe('fetchWithKeyFallback', () => {
  it('returns the success response untouched (no fallback on 200)', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(driveResponse(206))
    const result = await fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)
    expect(result.response.status).toBe(206)
    expect(result.usedBackupKey).toBe(false)
    expect(result.failedStatus).toBe(null)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries exactly once with the backup key URL when primary returns 403', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(driveResponse(403))
      .mockResolvedValueOnce(driveResponse(206))
    const result = await fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)
    expect(result.usedBackupKey).toBe(true)
    expect(result.failedStatus).toBe(403)
    expect(result.response.status).toBe(206)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const secondCall = fetchMock.mock.calls[1]
    expect(secondCall[0]).toContain(`key=${BACKUP_KEY}`)
    expect(secondCall[0]).not.toContain(`key=${PRIMARY_KEY}`)
  })

  it('retries exactly once when primary returns 429', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(driveResponse(429))
      .mockResolvedValueOnce(driveResponse(206))
    const result = await fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)
    expect(result.usedBackupKey).toBe(true)
    expect(result.failedStatus).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry and reports the status when no backup key is configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(driveResponse(403))
    const result = await fetchWithKeyFallback(MEDIA_URL, undefined)
    expect(result.usedBackupKey).toBe(false)
    expect(result.failedStatus).toBe(403)
    expect(result.response.status).toBe(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('never cascades: a 403 from the backup key is returned as-is', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(driveResponse(403))
      .mockResolvedValueOnce(driveResponse(403))
    const result = await fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)
    expect(result.usedBackupKey).toBe(true)
    expect(result.response.status).toBe(403)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does NOT trigger the backup on a 500 (ambiguous server error)', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(driveResponse(500))
    const result = await fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)
    expect(result.usedBackupKey).toBe(false)
    expect(result.failedStatus).toBe(null)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries with the backup key ONCE when the primary fetch throws (CORS block)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(driveResponse(206))
    const result = await fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)
    expect(result.usedBackupKey).toBe(true)
    expect(result.failedStatus).toBe(null)
    expect(result.primaryError).toBe('Failed to fetch')
    expect(result.response.status).toBe(206)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const secondCall = fetchMock.mock.calls[1]
    expect(secondCall[0]).toContain(`key=${BACKUP_KEY}`)
    expect(secondCall[0]).not.toContain(`key=${PRIMARY_KEY}`)
  })

  it('propagates a thrown primary fetch unchanged when NO backup key is configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(fetchWithKeyFallback(MEDIA_URL, undefined)).rejects.toThrow('Failed to fetch')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('never cascades: a throw from the backup fetch itself is re-thrown as-is', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('primary cors'))
      .mockRejectedValueOnce(new TypeError('backup cors'))
    await expect(fetchWithKeyFallback(MEDIA_URL, BACKUP_KEY)).rejects.toThrow('backup cors')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})