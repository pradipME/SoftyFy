import { useRef, useState } from 'react'
import { streamUrl } from '../../lib/stream'
import { PauseIcon, PlayIcon } from '../ui/icons'

interface TestPlayButtonProps {
  songId: string
  title: string
}

/**
 * Minimal Phase 5 streaming proof: a per-row play/pause toggle that drives a
 * hidden <audio> element hitting GET /api/songs/{id}/stream. The full player
 * (queue, seeking UI, global state) belongs to Phase 6.
 */
export function TestPlayButton({ songId, title }: TestPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      void audio.play().catch(() => setPlaying(false))
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={playing ? `Pause ${title}` : `Play ${title}`}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong"
    >
      {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      <audio
        ref={audioRef}
        src={streamUrl(songId)}
        preload="none"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setPlaying(false)}
      />
    </button>
  )
}
