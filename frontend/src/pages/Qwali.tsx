import { useMemo, useState } from 'react'
import { SongList } from '../components/song/SongList'
import { ArrowLeftIcon, ArrowRightIcon, PlayIcon } from '../components/ui/icons'
import { SONGS_BY_LIBRARY } from '../data/songs'
import { usePlayer } from '../context/PlayerContext'
import type { Song } from '../types/song'

type SortKey = 'title' | 'artist' | 'duration'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'duration', label: 'Duration' },
]
const QWALI_SONGS = SONGS_BY_LIBRARY['Qwali'] ?? []

function sortSongs(songs: Song[], key: SortKey, ascending: boolean): Song[] {
  const sorted = [...songs].sort((a, b) => key === 'duration'
    ? a.durationSec - b.durationSec
    : key === 'artist' ? a.artist.localeCompare(b.artist) : a.title.localeCompare(b.title))
  return ascending ? sorted : sorted.reverse()
}

export function QwaliPage() {
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [ascending, setAscending] = useState(true)
  const { playSong } = usePlayer()
  const sorted = useMemo(() => sortSongs(QWALI_SONGS, sortKey, ascending), [sortKey, ascending])

  return (
    <div className="sonic-page sonic-page--compact">
      <header>
        <p className="sonic-eyebrow">A devotional listening room</p>
        <h1 className="sonic-page-title mt-3">Qawwali</h1>
        <p className="sonic-page-intro">A collection of voices carried by rhythm, longing, and devotion.</p>
        {sorted.length > 0 && (
          <button type="button" className="sonic-action-primary mt-5" onClick={() => playSong(sorted[0], sorted)}>
            <PlayIcon /> Enter the session
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="sonic-sortbar" aria-label="Sort Qawwali tracks">
          <span className="sonic-sort-label">Order by</span>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button key={key} type="button" className={`sonic-sort-button${sortKey === key ? ' is-active' : ''}`} aria-pressed={sortKey === key} onClick={() => setSortKey(key)}>{label}</button>
          ))}
          <button type="button" className="sonic-sort-button flex w-9 items-center justify-center" aria-label={ascending ? 'Sorted ascending, reverse order' : 'Sorted descending, reverse order'} onClick={() => setAscending((value) => !value)}>
            {ascending ? <ArrowRightIcon className="h-3.5 w-3.5" /> : <ArrowLeftIcon className="h-3.5 w-3.5" />}
          </button>
        </div>
        <span className="sonic-result-meta">{sorted.length} tracks</span>
      </div>

      {sorted.length > 0 ? <SongList songs={sorted} queue={sorted} /> : (
        <div className="sonic-empty" role="status"><div><strong>No tracks in this room yet</strong><p>Add Qawwali songs to your collection to see them here.</p></div></div>
      )}
    </div>
  )
}
