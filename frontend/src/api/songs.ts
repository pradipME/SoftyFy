import { apiClient } from './client'
import type { PageResponse, SongSortOption } from '../types/api'
import type { Song } from '../types/song'

export interface SongListParams {
  page?: number
  size?: number
  sort?: SongSortOption
}

export interface CreateSongPayload {
  title: string
  durationSeconds?: number | null
  trackNumber?: number | null
  albumId?: string | null
  artistNames?: string[]
}

export interface PatchSongPayload {
  title?: string
  durationSeconds?: number | null
  trackNumber?: number | null
}

export function fetchSongs(params: SongListParams = {}): Promise<PageResponse<Song>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  if (params.sort) query.set('sort', params.sort)
  return apiClient.get(`/songs?${query.toString()}`)
}

export function fetchSong(id: string): Promise<Song> {
  return apiClient.get(`/songs/${encodeURIComponent(id)}`)
}

export function createSong(payload: CreateSongPayload): Promise<Song> {
  return apiClient.post('/songs', payload)
}

export function updateSong(id: string, payload: PatchSongPayload): Promise<Song> {
  return apiClient.patch(`/songs/${encodeURIComponent(id)}`, payload)
}

export function deleteSong(id: string): Promise<void> {
  return apiClient.delete(`/songs/${encodeURIComponent(id)}`)
}
