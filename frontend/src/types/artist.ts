import type { AlbumSummary } from './album'
import type { SongSummary } from './song'

export interface ArtistSummary {
  id: string
  name: string
}

export interface ArtistListItem {
  id: string
  name: string
  songCount: number
}

export interface ArtistDetail {
  id: string
  name: string
  albums: AlbumSummary[]
  songs: SongSummary[]
  createdAt: string
  updatedAt: string
}
