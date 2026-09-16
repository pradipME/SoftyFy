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
  /** True when the backup key was actually tried (primary returned 403/429). */
  usedBackupKey: boolean
  /** The primary 403/429 status that triggered the fallback, if any. */
  failedStatus: number | null
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
 * Fetches `url` with the primary key. If — and ONLY if — the response status
 * is exactly 403 or 429 and a backup key is configured, retries exactly once
 * with the backup key swapped in. No loop, no cascade: whatever the backup
 * request returns (success OR another 403/429) is the caller's to handle.
 * Timeouts, network errors, stalls and every other status code pass through
 * untouched with `usedBackupKey: false`.
 */
export async function fetchWithKeyFallback(
  url: string,
  backupKey: string | undefined,
  init?: RequestInit,
): Promise<KeyFallbackResult> {
  const primary = await fetch(url, init)
  const retryable = RETRYABLE_STATUSES.has(primary.status)
  if (!retryable || !backupKey) {
    return { response: primary, usedBackupKey: false, failedStatus: retryable ? primary.status : null }
  }
  const backup = await fetch(swapApiKey(url, backupKey), init)
  return { response: backup, usedBackupKey: true, failedStatus: primary.status }
}