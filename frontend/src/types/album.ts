import type { SongSummary } from './song'

export interface AlbumSummary {
  id: string
  title: string
  year: number | null
  artistId: string | null
  artistName: string | null
}

export interface AlbumDetail {
  id: string
  title: string
  year: number | null
  artistId: string | null
  artistName: string | null
  songs: SongSummary[]
  createdAt: string
  updatedAt: string
}
