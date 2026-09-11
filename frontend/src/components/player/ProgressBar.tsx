import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { formatPlaybackTime } from '../../lib/format'

/**
 * Seekable progress scrubber with current/total time labels. Falls back to the
 * song's `durationSec` until the real duration is read from the audio file.
 *
 * While the pointer is down we only move the thumb locally (no seeks, no
 * haptics); the actual seek commits once on release. Keyboard scrubbing still
 * seeks immediately on each arrow press.
 */
export function ProgressBar() {
  const { currentSong, currentTime, duration, seek } = usePlayer()
  const [preview, setPreview] = useState<number | null>(null)
  const pointerDragging = useRef(false)

  const total = duration > 0 ? duration : currentSong?.durationSec ?? 0
  const value = preview !== null ? Math.min(preview, total) : Math.min(currentTime, total)
  const percent = total > 0 ? (value / total) * 100 : 0

  const beginDrag = () => {
    pointerDragging.current = true
  }

  const endDrag = () => {
    if (!pointerDragging.current) return
    pointerDragging.current = false
    if (preview !== null) {
      seek(preview)
      setPreview(null)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value)
    if (pointerDragging.current) {
      setPreview(next)
    } else {
      seek(next)
    }
  }

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted">
        {formatPlaybackTime(value)}
      </span>
      <input
        type="range"
        min={0}
        max={total}
        step={0.5}
        value={value}
        disabled={total === 0}
        onChange={handleChange}
        onPointerDown={beginDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onBlur={endDrag}
        aria-label="Seek"
        className="scrubber h-1 min-w-0 flex-1 cursor-pointer"
        style={{ '--fill': `${percent}%` } as CSSProperties}
      />
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted">
        {formatPlaybackTime(total)}
      </span>
    </div>
  )
}