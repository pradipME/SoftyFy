import { useEffect, useState } from 'react'
import {
  appLogRing,
  connectionSummary,
  DEBUG_MAX_ENTRIES,
  debugEnabled,
  setDebugEnabled,
  type MediaLogEntry,
} from '../../lib/mediaDebug'

function formatBytes(value: unknown): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function summarize(entry: MediaLogEntry): string {
  const { tag, data } = entry
  const parts: string[] = []
  for (const key of ['songId', 'url']) {
    if (typeof data[key] === 'string') {
      const value = String(data[key])
      parts.push(`${key}=${key === 'url' ? value.replace(/^.*\/([^/?]+).*$/, '$1') : value}`)
    }
  }
  for (const key of ['reason', 'action', 'cached', 'slow', 'quality', 'qualityReason', 'status', 'source', 'size', 'fileSize', 'ageSec', 'evictedAgeSec', 'ratio', 'usage', 'quota']) {
    if (data[key] !== undefined) {
      const label =
        key === 'usage' || key === 'quota' || key === 'size' || key === 'fileSize'
          ? formatBytes(data[key])
          : String(data[key])
      parts.push(`${key}=${label}`)
    }
  }
  return parts.length > 0 ? `${tag} [${parts.join(', ')}]` : tag
}

export function DebugOverlay() {
  const [enabled, setEnabled] = useState(() => debugEnabled())
  const [open, setOpen] = useState(false)
  const [swEntries, setSwEntries] = useState<MediaLogEntry[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const post = (type: string, extra: Record<string, unknown> = {}) => {
      navigator.serviceWorker.controller?.postMessage({ type, ...extra })
    }

    post('SET_DEBUG', { enabled: true })

    let lastSeq = 0
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; entries?: MediaLogEntry[] } | undefined
      if (!data || data.type !== 'DEBUG_LOG' || !Array.isArray(data.entries)) return
      setSwEntries((prev) => {
        const next = [...prev]
        const entries = Array.isArray(data.entries) ? data.entries : []
        for (const entry of entries) {
          if (typeof entry?.seq === 'number' && entry.seq <= lastSeq) continue
          lastSeq = Math.max(lastSeq, entry.seq ?? 0)
          next.push(entry)
        }
        return next.slice(-DEBUG_MAX_ENTRIES)
      })
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    const timer = window.setInterval(() => post('GET_DEBUG_LOG'), 3000)

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage)
      window.clearInterval(timer)
      post('SET_DEBUG', { enabled: false })
    }
  }, [enabled])

  if (!enabled) return null

  const combined = [...swEntries, ...appLogRing].sort((a, b) => a.t - b.t).slice(-80)

  const buildReport = () => {
    const conn = (
      navigator as unknown as {
        connection?: { effectiveType?: string; rtt?: number; downlink?: number; saveData?: boolean }
      }
    ).connection
    let standalone = false
    try {
      standalone = window.matchMedia('(display-mode: standalone)').matches
    } catch {
      // matchMedia unavailable.
    }
    return JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        standalone,
        connection: conn
          ? {
              effectiveType: conn.effectiveType,
              rtt: conn.rtt,
              downlink: conn.downlink,
              saveData: conn.saveData,
            }
          : null,
        swEntries: swEntries.slice(),
        appEntries: appLogRing.slice(),
        merged: combined,
      },
      null,
      2,
    )
  }

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReport())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the JSON is also visible in the panel summary below
      // for manual selection.
      setCopied(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col items-end gap-2 font-mono text-[10px]">
      {open ? (
        <div className="flex max-h-[60vh] w-[92vw] max-w-sm flex-col rounded-xl border border-white/10 bg-neutral-950/95 p-3 shadow-2xl text-neutral-200">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-white">
              SoftyFy debug — {combined.length} events
            </span>
            <span className="text-neutral-500">{connectionSummary().effectiveType as string}</span>
          </div>
          <button
            type="button"
            onClick={copyReport}
            className="mb-2 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white active:bg-white/20"
          >
            {copied ? 'Copied ✓' : 'Copy JSON report'}
          </button>
          <div className="overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-black/40 p-2 text-neutral-300">
            {combined.length === 0 ? (
              'No events yet — play a few songs, then reopen this panel.'
            ) : (
              <div>
                {combined.map((entry, index) => (
                  <div key={`${entry.seq}-${index}`} className="mb-0.5">
                    <span className="text-neutral-500">
                      {new Date(entry.t).toISOString().slice(11, 23)} {entry.tag}
                    </span>
                    {' — '}
                    {summarize(entry)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setDebugEnabled(false)
                setEnabled(false)
              }}
              className="rounded-lg bg-red-500/15 px-3 py-1 text-[11px] font-medium text-red-300"
            >
              Disable debug
            </button>
            <span className="text-neutral-600">{appLogRing.length} app · {swEntries.length} sw</span>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-white/10 bg-neutral-900/90 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-neutral-300 shadow-lg"
      >
        DEBUG
      </button>
    </div>
  )
}