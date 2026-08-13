import type { AlbumSummary } from './album'
import type { ArtistSummary } from './artist'
import type { PlaylistSummary } from './playlist'
import type { SongSummary } from './song'

export interface SearchResults {
  songs: SongSummary[]
  artists: ArtistSummary[]
  albums: AlbumSummary[]
  playlists: PlaylistSummary[]
}
