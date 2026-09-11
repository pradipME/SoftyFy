import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StaggerItem } from '../components/motion/Stagger'
import { SongList } from '../components/song/SongList'
import { Button } from '../components/ui/Button'

import { ArrowLeftIcon, ArrowRightIcon } from '../components/ui/icons'
import { useDownloads } from '../lib/downloads'
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
  const [downloadsOnly, setDownloadsOnly] = useState(false)
  const { downloadedIds } = useDownloads()
  const sorted = useMemo(() => sortSongs(baseSongs, sortKey, ascending), [baseSongs, sortKey, ascending])
  const visible = downloadsOnly ? sorted.filter((s) => downloadedIds.includes(s.id)) : sorted

  const heading = albumFilter ?? 'Your Library'

  return (
    <div className="flex flex-col gap-4">
      <StaggerItem className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted">
            {downloadsOnly ? `${visible.length} of ${sorted.length} songs` : `${sorted.length} songs`}
          </p>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={downloadsOnly ? 'primary' : 'secondary'}
              aria-label={downloadsOnly ? 'Showing downloads — tap to show all' : 'Show only downloaded songs'}
              onClick={() => setDownloadsOnly((value) => !value)}
            >
              Downloads
            </Button>
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

      <SongList songs={visible} queue={visible} />
    </div>
  )
}
