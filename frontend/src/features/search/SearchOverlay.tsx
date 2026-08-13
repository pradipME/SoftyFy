import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSearch } from '../../hooks/useSearch'
import {
  CloseIcon,
  ListMusicIcon,
  MusicIcon,
  SearchIcon,
} from '../../components/ui/icons'
import { EmptyState } from '../../components/ui/EmptyState'
import { ListSkeleton } from '../../components/ui/Skeleton'
import type { AlbumSummary } from '../../types/album'
import type { ArtistSummary } from '../../types/artist'
import type { PlaylistSummary } from '../../types/playlist'
import type { SongSummary } from '../../types/song'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

function SongRow({ song }: { song: SongSummary }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-elevated text-dim">
        <MusicIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        <p className="truncate text-xs text-muted">{song.artistNames.join(', ') || 'Unknown artist'}</p>
      </div>
    </div>
  )
}

function ArtistRow({ artist }: { artist: ArtistSummary }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-strong">
        {artist.name.slice(0, 2).toUpperCase()}
      </div>
      <p className="truncate text-sm font-medium">{artist.name}</p>
    </div>
  )
}

function AlbumRow({ album }: { album: AlbumSummary }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-soft text-xs font-semibold text-white">
        {album.title.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{album.title}</p>
        <p className="truncate text-xs text-muted">
          {album.artistName ?? 'Unknown artist'}
          {album.year ? ` · ${album.year}` : ''}
        </p>
      </div>
    </div>
  )
}

function PlaylistRow({ playlist }: { playlist: PlaylistSummary }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-elevated text-accent-strong">
        <ListMusicIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{playlist.name}</p>
        <p className="truncate text-xs text-muted">
          {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </div>
  )
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-dim">{title}</h4>
      {children}
    </div>
  )
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const { data, loading } = useSearch(open ? query : '')

  if (!open) return null

  const trimmed = query.trim()
  const hasResults =
    data !== null &&
    (data.songs.length > 0 ||
      data.artists.length > 0 ||
      data.albums.length > 0 ||
      data.playlists.length > 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-2 sm:p-6">
      <div className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <SearchIcon className="h-5 w-5 text-dim" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
            }}
            placeholder="Search songs, artists, albums, playlists…"
            className="w-full bg-transparent text-sm text-fg placeholder:text-dim focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-full p-1.5 text-dim hover:bg-elevated hover:text-fg"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <ListSkeleton rows={5} className="px-1 py-2" />
          ) : trimmed.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={<SearchIcon className="h-8 w-8" />}
                title="Type to search your library"
                description="Find songs, artists, albums and playlists."
              />
            </div>
          ) : !hasResults || data === null ? (
            <div className="py-10">
              <EmptyState
                icon={<SearchIcon className="h-8 w-8" />}
                title="No results"
                description={`Nothing matched "${trimmed}".`}
              />
            </div>
          ) : (
            <div>
              {data.songs.length > 0 ? (
                <ResultSection title="Songs">
                  {data.songs.slice(0, 5).map((song) => (
                    <Link key={song.id} to={`/songs`} onClick={onClose} className="block rounded-lg hover:bg-elevated">
                      <SongRow song={song} />
                    </Link>
                  ))}
                </ResultSection>
              ) : null}
              {data.artists.length > 0 ? (
                <ResultSection title="Artists">
                  {data.artists.slice(0, 5).map((artist) => (
                    <Link key={artist.id} to={`/artists/${artist.id}`} onClick={onClose} className="block rounded-lg hover:bg-elevated">
                      <ArtistRow artist={artist} />
                    </Link>
                  ))}
                </ResultSection>
              ) : null}
              {data.albums.length > 0 ? (
                <ResultSection title="Albums">
                  {data.albums.slice(0, 5).map((album) => (
                    <Link key={album.id} to={`/albums/${album.id}`} onClick={onClose} className="block rounded-lg hover:bg-elevated">
                      <AlbumRow album={album} />
                    </Link>
                  ))}
                </ResultSection>
              ) : null}
              {data.playlists.length > 0 ? (
                <ResultSection title="Playlists">
                  {data.playlists.slice(0, 5).map((playlist) => (
                    <Link key={playlist.id} to={`/playlists/${playlist.id}`} onClick={onClose} className="block rounded-lg hover:bg-elevated">
                      <PlaylistRow playlist={playlist} />
                    </Link>
                  ))}
                </ResultSection>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
