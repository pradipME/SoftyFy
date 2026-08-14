import type { CSSProperties } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { formatPlaybackTime } from '../../lib/format'

/**
 * Seekable progress scrubber with current/total time labels. Falls back to the
 * song's `durationSec` until the real duration is read from the audio file.
 */
export function ProgressBar() {
  const { currentSong, currentTime, duration, seek } = usePlayer()
  const total = duration > 0 ? duration : currentSong?.durationSec ?? 0
  const value = Math.min(currentTime, total)
  const percent = total > 0 ? (value / total) * 100 : 0

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
        onChange={(event) => seek(Number(event.target.value))}
        aria-label="Seek"
        className="scrubber h-1 min-w-0 flex-1 cursor-pointer"
        style={{ '--fill': `${percent}%` } as CSSProperties}
      />
      <span className="w-9 shrink-0 text-[11px] tabular-nums text-muted">
        {formatPlaybackTime(total)}
      </span>
    </div>
  )
}
