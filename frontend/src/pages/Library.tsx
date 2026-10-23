import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SongList } from '../components/song/SongList'
import { Cover } from '../components/song/Cover'
import { ArrowLeftIcon, ArrowRightIcon, HeartIcon, MoreIcon, PlayIcon, SearchIcon } from '../components/ui/icons'
import { SONGS } from '../data/songs'
import { usePlayer } from '../context/PlayerContext'
import type { Song } from '../types/song'
import { formatPlaybackTime } from '../lib/format'

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
  const album = searchParams.get('album')
  const songs = useMemo(() => album ? SONGS.filter((song) => song.library === album) : SONGS, [album])
  return album ? <AlbumDetail title={album} songs={songs} /> : <AllTracks songs={songs} />
}

function AlbumDetail({ title, songs }: { title: string; songs: Song[] }) {
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [ascending, setAscending] = useState(true)
  const [liked, setLiked] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuSongId, setMenuSongId] = useState<string | null>(null)
  const sorted = useMemo(() => sortSongs(songs, sortKey, ascending), [songs, sortKey, ascending])
  const totalDuration = songs.reduce((sum, song) => sum + song.durationSec, 0)
  const cover = songs[0]?.coverSrc

  return (
    <div className="sonic-page sonic-page--compact metro-album-page">
      <div className="metro-album-toolbar">
        <button type="button" onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/')} aria-label="Go back"><ArrowLeftIcon /></button>
        <Link to="/search" aria-label="Search"><SearchIcon /></Link>
      </div>
      <header className="metro-album-detail" style={{ '--album-accent': colorForCollection(title) } as CSSProperties}>
        <div className="metro-album-detail-art">
          {cover && <Cover src={cover} alt={`${title} cover`} className="metro-album-detail-cover" />}
          <span>{title}</span>
        </div>
        <h1>{title}</h1>
        <p className="metro-album-source">SoftyFy collection</p>
        <p className="metro-album-meta">{songs.length} songs{totalDuration > 0 ? ` · ${formatPlaybackTime(totalDuration)}` : ''}</p>
        <p className="metro-album-description">A collection from your personal music library.</p>
        <div className="metro-album-controls">
          <button type="button" className={`metro-album-like${liked ? ' is-liked' : ''}`} onClick={() => setLiked((value) => !value)} aria-label={liked ? 'Unlike collection' : 'Like collection'} aria-pressed={liked}><HeartIcon /></button>
          <button type="button" className="metro-album-play-all" onClick={() => sorted[0] && playSong(sorted[0], sorted)} aria-label={`Play ${title}`} disabled={sorted.length === 0}><PlayIcon /></button>
          <div className="metro-album-more-wrap">
            <button type="button" className="metro-album-more" onClick={() => setMoreOpen((value) => !value)} aria-label="Collection options" aria-expanded={moreOpen}><MoreIcon /></button>
            {moreOpen && <div className="metro-album-more-menu" role="menu">{SORT_OPTIONS.map(({ key, label }) => <button key={key} type="button" role="menuitem" onClick={() => { setSortKey(key); setMoreOpen(false) }}>Sort by {label}</button>)}</div>}
          </div>
        </div>
      </header>

      {sorted.length ? (
        <div className="metro-album-track-list" aria-label={`${title} songs`}>
          {sorted.map((song, index) => (
            <article className="metro-album-track-row" key={song.id}>
              <button type="button" className="metro-album-track-main" onClick={() => playSong(song, sorted)}>
                <motion.div className="metro-album-track-cover-transition" layoutId={`now-playing-art-${song.id}`}>
                  <Cover src={song.coverSrc} alt="" className="metro-album-track-cover" />
                </motion.div>
                <span><strong>{song.title}</strong><small>{song.artist}{song.durationSec > 0 ? ` · ${formatPlaybackTime(song.durationSec)}` : ''}</small></span>
              </button>
              <div className="metro-track-menu-wrap">
                <button type="button" className="metro-track-more" onClick={() => setMenuSongId((id) => id === song.id ? null : song.id)} aria-label={`More options for ${song.title}`} aria-expanded={menuSongId === song.id}><MoreIcon /></button>
                {menuSongId === song.id && <div className="metro-track-menu" role="menu"><button type="button" role="menuitem" onClick={() => { playSong(song, [song]); setMenuSongId(null) }}>Play track</button><button type="button" role="menuitem" onClick={() => { playSong(song, sorted.slice(index)); setMenuSongId(null) }}>Play from here</button></div>}
              </div>
            </article>
          ))}
        </div>
      ) : <div className="sonic-empty" role="status"><div><strong>Album not found</strong><p>Return to your library to choose another collection.</p></div></div>}
    </div>
  )
}

function AllTracks({ songs }: { songs: Song[] }) {
  const { playSong } = usePlayer()
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [ascending, setAscending] = useState(true)
  const sorted = useMemo(() => sortSongs(songs, sortKey, ascending), [songs, sortKey, ascending])

  return (
    <div className="sonic-page sonic-page--compact">
      <header>
        <p className="sonic-eyebrow">Everything you keep close</p>
        <h1 className="sonic-page-title mt-3">Your Library</h1>
        <p className="sonic-page-intro">{songs.length} tracks, arranged for the way you listen.</p>
        {sorted.length > 0 && <button type="button" className="sonic-action-primary mt-5" onClick={() => playSong(sorted[0], sorted)}><PlayIcon /> Play all</button>}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="sonic-sortbar" aria-label="Sort tracks">
          <span className="sonic-sort-label">Order by</span>
          {SORT_OPTIONS.map(({ key, label }) => <button key={key} type="button" className={`sonic-sort-button${sortKey === key ? ' is-active' : ''}`} aria-pressed={sortKey === key} onClick={() => setSortKey(key)}>{label}</button>)}
          <button type="button" className="sonic-sort-button flex w-9 items-center justify-center" aria-label={ascending ? 'Sorted ascending, reverse order' : 'Sorted descending, reverse order'} onClick={() => setAscending((value) => !value)}>{ascending ? <ArrowRightIcon className="h-3.5 w-3.5" /> : <ArrowLeftIcon className="h-3.5 w-3.5" />}</button>
        </div>
      </div>
      {sorted.length ? <SongList songs={sorted} queue={sorted} /> : <div className="sonic-empty" role="status"><div><strong>No songs yet</strong><p>Add music to your collection to see it here.</p></div></div>}
    </div>
  )
}

function colorForCollection(seed: string): string {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360} 24% 40%)`
}
