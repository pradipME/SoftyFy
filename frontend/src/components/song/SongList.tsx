import type { Song } from '../../types/song'
import { Stagger, StaggerItem } from '../motion/Stagger'
import { SongRow } from './SongRow'

interface SongListProps {
  songs: Song[]
  /** Optional id of the list used as the playback queue (defaults to the same songs). */
  queue?: Song[]
}

export function SongList({ songs, queue = songs }: SongListProps) {
  return (
    <Stagger className="flex flex-col gap-0.5">
      {songs.map((song) => (
        <StaggerItem key={song.id}>
          <SongRow song={song} queue={queue} />
        </StaggerItem>
      ))}
    </Stagger>
  )
}
