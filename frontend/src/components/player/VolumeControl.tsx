import type { CSSProperties } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { IconButton } from '../ui/IconButton'
import { VolumeIcon, VolumeMuteIcon } from '../ui/icons'

/** Volume slider + mute toggle. Desktop-only (hidden on small screens). */
export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = usePlayer()
  const percent = Math.round((muted ? 0 : volume) * 100)

  return (
    <div className="hidden items-center gap-1.5 md:flex">
      <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>
        {muted || volume === 0 ? (
          <VolumeMuteIcon className="h-4 w-4" />
        ) : (
          <VolumeIcon className="h-4 w-4" />
        )}
      </IconButton>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        aria-label="Volume"
        className="scrubber h-1 w-24 cursor-pointer"
        style={{ '--fill': `${percent}%` } as CSSProperties}
      />
    </div>
  )
}
