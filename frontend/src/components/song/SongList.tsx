import type { Song } from '../../types/song'
import { Stagger, StaggerItem } from '../motion/Stagger'
import { SongRow } from './SongRow'

interface SongListProps {
  songs: Song[]
  /** Optional id of the list used as the playback queue (defaults to the same songs). */
  queue?: Song[]
  /** Show track numbers (default: true) */
  showIndex?: boolean
}

export function SongList({ songs, queue = songs, showIndex = true }: SongListProps) {
  return (
    <div className={`sonic-song-list${showIndex ? '' : ' is-search-results'}`}>
      <div className="sonic-track-head" aria-hidden="true">
        {showIndex ? <span>No.</span> : <span />}
        <span />
        <span>Track</span>
        <span>Collection</span>
        <span>Time</span>
      </div>
      <Stagger className="sonic-song-list-rows">
        {songs.map((song, i) => (
          <StaggerItem key={song.id}>
            <SongRow song={song} queue={queue} index={showIndex ? i : undefined} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}
