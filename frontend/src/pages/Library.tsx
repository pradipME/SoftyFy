import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StaggerItem } from '../components/motion/Stagger'
import { SongList } from '../components/song/SongList'
import { Cover } from '../components/song/Cover'
import { Button } from '../components/ui/Button'
import { ArrowLeftIcon, ArrowRightIcon } from '../components/ui/icons'
import { SONGS } from '../data/songs'
import type { Song } from '../types/song'

type SortKey = 'title' | 'artist' | 'duration'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'duration', label: 'Duration' },
]

function sortSongs(songs: Song[], key: SortKey, ascending: boolean): Song[] {
  const sorted = [...songs].sort((a, b) => {
    switch (key) {
      case 'duration':
        return a.durationSec - b.durationSec
      case 'artist':
        return a.artist.localeCompare(b.artist)
      default:
        return a.title.localeCompare(b.title)
    }
  })
  return ascending ? sorted : sorted.reverse()
}

export function LibraryPage() {
  const [searchParams] = useSearchParams()
  const albumFilter = searchParams.get('album')

  const baseSongs = useMemo(
    () => (albumFilter ? SONGS.filter((s) => s.library === albumFilter) : SONGS),
    [albumFilter],
  )

  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [ascending, setAscending] = useState(true)
  const sorted = useMemo(() => sortSongs(baseSongs, sortKey, ascending), [baseSongs, sortKey, ascending])

  const heading = albumFilter ?? 'Your Library'

  // If viewing a specific album, show cover of first song
  const heroCover = albumFilter && baseSongs.length > 0 ? baseSongs[0].coverSrc : null

  return (
    <div className="flex flex-col gap-6">
      {/* ── Album hero (when filtering by album) ──────────────────── */}
      {heroCover ? (
        <StaggerItem>
          <div className="glass-card flex items-center gap-5 p-4 sm:p-5">
            <Cover
              src={heroCover}
              alt={heading}
              className="h-24 w-24 shrink-0 rounded-2xl shadow-xl sm:h-32 sm:w-32"
            />
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">Album</p>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1>
              <p className="mt-1 text-sm text-muted">{sorted.length} songs</p>
            </div>
          </div>
        </StaggerItem>
      ) : (
        <StaggerItem className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1>
          <p className="text-sm text-muted">{sorted.length} songs</p>
        </StaggerItem>
      )}

      {/* ── Sort controls ─────────────────────────────────────────── */}
      <StaggerItem>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-xs text-dim">Sort by</span>
          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={sortKey === key ? 'primary' : 'secondary'}
                onClick={() => setSortKey(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="secondary"
            aria-label={
              ascending ? 'Sorted ascending — tap to reverse' : 'Sorted descending — tap to reverse'
            }
            onClick={() => setAscending((value) => !value)}
          >
            {ascending ? (
              <ArrowRightIcon className="h-4 w-4" />
            ) : (
              <ArrowLeftIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </StaggerItem>

      {/* ── Song list ─────────────────────────────────────────────── */}
      <SongList songs={sorted} queue={sorted} />
    </div>
  )
}
