import { useMemo, useState } from 'react'
import { StaggerItem } from '../components/motion/Stagger'
import { SongList } from '../components/song/SongList'
import { SearchIcon } from '../components/ui/icons'
import { SONGS } from '../data/songs'

function matches(song: (typeof SONGS)[number], query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return false
  return (
    song.title.toLowerCase().includes(q) ||
    song.artist.toLowerCase().includes(q) ||
    (song.album ?? '').toLowerCase().includes(q)
  )
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => SONGS.filter((song) => matches(song, query)), [query])

  return (
    <div className="flex flex-col gap-4">
      <StaggerItem className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted">Find something in your collection.</p>
      </StaggerItem>

      <StaggerItem className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, albums…"
          autoFocus
          className="h-12 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-fg shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </StaggerItem>

      {query.trim() === '' ? (
        <p className="px-1 text-sm text-muted">
          Start typing to search your collection by title, artist, or album.
        </p>
      ) : results.length === 0 ? (
        <p className="px-1 text-sm text-muted">No songs match “{query.trim()}”.</p>
      ) : (
        <>
          <p className="px-1 text-xs text-muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          <SongList songs={results} queue={results} />
        </>
      )}
    </div>
  )
}
