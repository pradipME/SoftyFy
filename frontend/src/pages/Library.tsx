import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SongList } from '../components/song/SongList'
import { ArrowLeftIcon, ArrowRightIcon, PlayIcon } from '../components/ui/icons'
import { SONGS } from '../data/songs'
import { usePlayer } from '../context/PlayerContext'
import type { Song } from '../types/song'

type SortKey = 'title' | 'artist' | 'duration'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'duration', label: 'Duration' },
]

function sortSongs(songs: Song[], key: SortKey, ascending: boolean): Song[] {
  const sorted = [...songs].sort((a, b) => key === 'duration'
    ? a.durationSec - b.durationSec
    : key === 'artist' ? a.artist.localeCompare(b.artist) : a.title.localeCompare(b.title))
  return ascending ? sorted : sorted.reverse()
}

export function LibraryPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const albumFilter = searchParams.get('album')
  const { playSong } = usePlayer()
  const baseSongs = useMemo(
    () => albumFilter ? SONGS.filter((song) => song.library === albumFilter) : SONGS,
    [albumFilter],
  )
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [ascending, setAscending] = useState(true)
  const sorted = useMemo(() => sortSongs(baseSongs, sortKey, ascending), [baseSongs, sortKey, ascending])
  const heading = albumFilter ?? 'Your Library'
  const heroCover = baseSongs[0]?.coverSrc

  return (
    <div className="sonic-page sonic-page--compact">
      {albumFilter ? (
        <header className="sonic-album-hero" style={{ '--album-accent': colorForCollection(albumFilter) } as CSSProperties}>
          {heroCover && <img src={heroCover} alt="" className="sonic-album-cover-bg" />}
          <div className="sonic-album-copy">
            <p className="sonic-eyebrow">Curated collection</p>
            <h1 className="sonic-page-title">{heading}</h1>
            <p>{sorted.length} tracks · in your personal archive</p>
            {sorted.length > 0 && (
              <button type="button" className="sonic-action-primary mt-5" onClick={() => playSong(sorted[0], sorted)}>
                <PlayIcon /> Play collection
              </button>
            )}
          </div>
        </header>
      ) : (
        <header>
          <p className="sonic-eyebrow">Everything you keep close</p>
          <h1 className="sonic-page-title mt-3">Your Library</h1>
          <p className="sonic-page-intro">{SONGS.length} tracks, arranged for the way you listen.</p>
          {sorted.length > 0 && (
            <button type="button" className="sonic-action-primary mt-5" onClick={() => playSong(sorted[0], sorted)}>
              <PlayIcon /> Play all
            </button>
          )}
        </header>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="sonic-sortbar" aria-label="Sort tracks">
          <span className="sonic-sort-label">Order by</span>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button key={key} type="button" className={`sonic-sort-button${sortKey === key ? ' is-active' : ''}`} aria-pressed={sortKey === key} onClick={() => setSortKey(key)}>
              {label}
            </button>
          ))}
          <button type="button" className="sonic-sort-button flex w-9 items-center justify-center" aria-label={ascending ? 'Sorted ascending, reverse order' : 'Sorted descending, reverse order'} onClick={() => setAscending((value) => !value)}>
            {ascending ? <ArrowRightIcon className="h-3.5 w-3.5" /> : <ArrowLeftIcon className="h-3.5 w-3.5" />}
          </button>
        </div>
        {albumFilter && <button type="button" className="sonic-text-link border-0 bg-transparent" onClick={() => navigate('/library')}>All tracks ↗</button>}
      </div>

      {sorted.length > 0 ? (
        <SongList songs={sorted} queue={sorted} />
      ) : (
        <div className="sonic-empty" role="status">
          <div><strong>Collection not found</strong><p>That collection may have moved. Return to your library to explore the archive.</p></div>
        </div>
      )}
    </div>
  )
}

function colorForCollection(seed: string): string {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360} 24% 40%)`
}
