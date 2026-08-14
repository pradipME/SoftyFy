import type { Song } from '../../types/song'
import { PlayIcon } from '../ui/icons'
import { Cover } from './Cover'

interface SongCardProps {
  song: Song
  onPlay: (song: Song) => void
  className?: string
}

export function SongCard({ song, onPlay, className = '' }: SongCardProps) {
  return (
    <button
      type="button"
      onClick={() => onPlay(song)}
      aria-label={`Play ${song.title} by ${song.artist}`}
      className={`group flex w-full flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.045] p-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      <div className="relative">
        <Cover
          src={song.coverSrc}
          alt={song.title}
          className="aspect-square w-full rounded-xl shadow-lg shadow-black/40"
        />
        <span className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-black shadow-[0_6px_18px_rgba(29,185,84,0.45)] transition-transform duration-200 group-hover:scale-110 md:translate-y-1 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <PlayIcon className="h-5 w-5" />
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{song.title}</p>
        <p className="truncate text-xs text-muted">{song.artist}</p>
      </div>
    </button>
  )
}
