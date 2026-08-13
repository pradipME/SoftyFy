import type { SongSummary } from './song'

export interface Favorite {
  songId: string
  song: SongSummary
  createdAt: string
}
