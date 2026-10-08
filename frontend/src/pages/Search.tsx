import { useMemo, useRef, useState } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-5">
      <StaggerItem className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted">Find something in your collection.</p>
      </StaggerItem>

      {/* Search input */}
      <StaggerItem className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, albums…"
          autoFocus
          className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.05] pl-11 pr-4 text-sm text-fg shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md placeholder:text-dim focus:border-accent/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all duration-150"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-muted hover:bg-white/20 hover:text-fg transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </StaggerItem>

      {/* Results */}
      {query.trim() === '' ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
            <SearchIcon className="h-7 w-7 text-muted" />
          </div>
          <p className="text-sm text-muted">
            Start typing to search by title, artist, or album.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
            <span className="text-3xl">🎵</span>
          </div>
          <p className="text-sm text-muted">
            No songs match &ldquo;{query.trim()}&rdquo;
          </p>
        </div>
      ) : (
        <>
          <p className="px-1 text-xs text-muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          <SongList songs={results} queue={results} showIndex={false} />
        </>
      )}
    </div>
  )
}
