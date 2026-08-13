import type { AlbumSummary } from './album'
import type { ArtistSummary } from './artist'

export interface AudioFile {
  id: string
  storageProvider: string
  storageKey: string
  format: string | null
  label: string | null
  bitrateKbps: number | null
  sampleRateHz: number | null
  channels: number | null
  bitDepth: number | null
  sizeBytes: number | null
  contentType: string | null
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
