import { usePlayerApi, usePlayerState } from '../../state/PlayerContext'
import { IconButton } from '../ui/IconButton'
import { VolumeIcon, VolumeMuteIcon } from '../ui/icons'

export function toggleClass(active: boolean): string {
  return `rounded-full p-2 transition-colors ${
    active ? 'text-accent-strong hover:bg-accent/10' : 'text-dim hover:bg-elevated hover:text-fg'
  }`
}

export function SeekBar({ className = '' }: { className?: string }) {
  const { currentTime, duration } = usePlayerState()
  const { seek } = usePlayerApi()
  const max = Math.max(0, duration)
  const value = Math.min(currentTime, max)
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={1}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => seek(Number(event.target.value))}
      aria-label="Seek"
      className={`h-1.5 w-full cursor-pointer accent-accent ${className}`}
      disabled={max === 0}
    />
  )
}

export function VolumeControl() {
  const { volume, isMuted } = usePlayerState()
  const { setVolume, toggleMute } = usePlayerApi()
  const effective = isMuted ? 0 : volume
  return (
    <div className="flex items-center gap-2">
      <IconButton label={isMuted ? 'Unmute' : 'Mute'} size="sm" onClick={toggleMute}>
        {isMuted || effective === 0 ? (
          <VolumeMuteIcon className="h-4 w-4" />
        ) : (
          <VolumeIcon className="h-4 w-4" />
        )}
      </IconButton>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(effective * 100)}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        aria-label="Volume"
        className="w-24 cursor-pointer accent-accent"
      />
    </div>
  )
}
