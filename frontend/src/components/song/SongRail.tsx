import type { Song } from '../../types/song'
import { Stagger, StaggerItem } from '../motion/Stagger'
import { SongCard } from './SongCard'

interface SongRailProps {
  songs: Song[]
  onPlay: (song: Song) => void
}

/**
 * Horizontally scrollable row of album cards with snap — the second spatial
 * rhythm on Home alongside the vertical list.
 */
export function SongRail({ songs, onPlay }: SongRailProps) {
  return (
    <Stagger className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-1">
      {songs.map((song) => (
        <StaggerItem key={song.id} className="w-40 shrink-0 snap-start">
          <SongCard song={song} onPlay={onPlay} />
        </StaggerItem>
      ))}
    </Stagger>
  )
}
