import type { AlbumSummary } from './album'
import type { ArtistSummary } from './artist'

export interface AudioFile {
  id: string
  storageProvider: string
  storageKey: string
  format: string | null
  bitrateKbps: number | null
  sizeBytes: number | null
  primary: boolean
}

export interface SongSummary {
  id: string
  title: string
  durationSeconds: number | null
  artistNames: string[]
  albumId: string | null
  albumTitle: string | null
}

export interface Song {
  id: string
  title: string
  durationSeconds: number | null
  trackNumber: number | null
  album: AlbumSummary | null
  artists: ArtistSummary[]
  audioFiles: AudioFile[]
  createdAt: string
  updatedAt: string
}
