import type { SongSummary } from './song'

export interface PlaylistSummary {
  id: string
  name: string
  description: string | null
  songCount: number
}

export interface PlaylistDetail {
  id: string
  name: string
  description: string | null
  songs: SongSummary[]
  createdAt: string
  updatedAt: string
}
