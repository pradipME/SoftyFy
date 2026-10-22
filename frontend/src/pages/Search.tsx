import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SongList } from '../components/song/SongList'
import { SearchIcon } from '../components/ui/icons'
import { LIBRARIES, SONGS } from '../data/songs'

function matches(song: (typeof SONGS)[number], query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q) ||
    (song.album ?? '').toLowerCase().includes(q) || song.library.toLowerCase().includes(q)
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => SONGS.filter((song) => matches(song, query)), [query])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  return (
    <div className="sonic-page sonic-page--compact">
      <header>
        <p className="sonic-eyebrow">Find a feeling</p>
        <h1 className="sonic-page-title mt-3">Search the archive</h1>
        <p className="sonic-page-intro">Find a track, artist, album, or collection already in your room.</p>
      </header>

      <div className="sonic-search-box">
        <SearchIcon aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you in the mood to hear?"
          aria-label="Search songs, artists, albums, and collections"
          className="sonic-search-input"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search" className="sonic-search-clear">
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {query.trim() ? (
        results.length ? (
          <section aria-label="Search results">
            <div className="sonic-section-head mb-3">
              <div>
                <p className="sonic-eyebrow">Matches in your archive</p>
                <h2>Tracks that found you</h2>
              </div>
              <p className="sonic-result-meta">{results.length} {results.length === 1 ? 'track' : 'tracks'}</p>
            </div>
            <SongList songs={results} queue={results} showIndex={false} />
          </section>
        ) : (
          <div className="sonic-empty" role="status">
            <div><strong>No signal found</strong><p>No tracks match “{query.trim()}”. Try a title, artist, or collection.</p></div>
          </div>
        )
      ) : (
        <section aria-labelledby="browse-collections">
          <div className="sonic-section-head">
            <div><p className="sonic-eyebrow">Start somewhere familiar</p><h2 id="browse-collections">Browse collections</h2></div>
            <span className="sonic-result-meta">{LIBRARIES.length} collections</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LIBRARIES.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => navigate(`/library?album=${encodeURIComponent(name)}`)}
                className="border border-white/10 bg-white/[0.025] px-4 py-3 text-left transition-colors hover:border-accent/40 hover:bg-white/[0.05]"
              >
                <span className="mr-3 text-[9px] tracking-[.14em] text-accent">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-sm text-fg">{name}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
