/**
 * Backup Drive API key fallback — a SAFETY-NET for the service worker's audio
 * fetch.
 *
 * STAYS MINIMAL ON PURPOSE. It answers exactly one question: "the primary key
 * answered 403 or 429 — retry once with the backup key". It must NOT grow into
 * the general retry logic that the old multi-host fallback became, which used
 * ambiguous triggers (stalls, thin buffers, generic errors) and caused an
 * infinite-buffering production bug.
 */

export interface KeyFallbackResult {
  response: Response
  /** True when the backup key was actually tried (primary returned 403/429 or its fetch threw). */
  usedBackupKey: boolean
  /** The primary 403/429 status that triggered the fallback, if any. */
  failedStatus: number | null
  /**
   * Set when the primary fetch THREW instead of resolving (CORS block,
   * network failure — browser rejects with a TypeError). No status is
   * readable in that case, so callers distinguishing the two triggers read
   * this instead of `failedStatus`.
   */
  primaryError?: string
}

/** Only these exact HTTP statuses may trigger the backup key. */
const RETRYABLE_STATUSES = new Set([403, 429])

/** Replaces the `key` query parameter in a Drive media URL. */
export function swapApiKey(url: string, newKey: string): string {
  const parsed = new URL(url)
  parsed.searchParams.set('key', newKey)
  return parsed.toString()
}

/**
 * Fetches `url` with the primary key, and retries exactly once with the
 * backup key in exactly TWO cases:
 *  - the response resolved with status 403 or 429, or
 *  - the primary fetch THREW (CORS block / network failure — a request that
 *    should succeed never throws, so this is itself a strong signal).
 * No loop, no cascade: whatever the backup request returns (success, another
 * 403/429, or its own throw) is the caller's to handle. Every other status
 * code passes through untouched with `usedBackupKey: false`.
 */
export async function fetchWithKeyFallback(
  url: string,
  backupKey: string | undefined,
  init?: RequestInit,
): Promise<KeyFallbackResult> {
  let primary: Response
  try {
    primary = await fetch(url, init)
  } catch (err) {
    // No status code is readable here — but a fetch that throws when it should
    // succeed is exactly the CORS-blocked-403 scenario. Try the backup once.
    if (!backupKey) throw err
    const backup = await fetch(swapApiKey(url, backupKey), init)
    return {
      response: backup,
      usedBackupKey: true,
      failedStatus: null,
      primaryError: err instanceof Error ? err.message : String(err),
    }
  }
  const retryable = RETRYABLE_STATUSES.has(primary.status)
  if (!retryable || !backupKey) {
    return { response: primary, usedBackupKey: false, failedStatus: retryable ? primary.status : null }
  }
  const backup = await fetch(swapApiKey(url, backupKey), init)
  return { response: backup, usedBackupKey: true, failedStatus: primary.status }
}