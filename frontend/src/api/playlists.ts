import { apiClient } from './client'
import type { PageResponse } from '../types/api'
import type { PlaylistDetail, PlaylistSummary } from '../types/playlist'

export interface CreatePlaylistPayload {
  name: string
  description?: string | null
}

export interface PatchPlaylistPayload {
  name?: string
  description?: string | null
}

export function fetchPlaylists(page = 0, size = 20): Promise<PageResponse<PlaylistSummary>> {
  return apiClient.get(`/playlists?page=${page}&size=${size}`)
}

export function fetchPlaylist(id: string): Promise<PlaylistDetail> {
  return apiClient.get(`/playlists/${encodeURIComponent(id)}`)
}

export function createPlaylist(payload: CreatePlaylistPayload): Promise<PlaylistDetail> {
  return apiClient.post('/playlists', payload)
}

export function updatePlaylist(id: string, payload: PatchPlaylistPayload): Promise<PlaylistDetail> {
  return apiClient.patch(`/playlists/${encodeURIComponent(id)}`, payload)
}

export function deletePlaylist(id: string): Promise<void> {
  return apiClient.delete(`/playlists/${encodeURIComponent(id)}`)
}

export function addSongsToPlaylist(id: string, songIds: string[]): Promise<PlaylistDetail> {
  return apiClient.post(`/playlists/${encodeURIComponent(id)}/songs`, { songIds })
}

export function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  return apiClient.delete(`/playlists/${encodeURIComponent(playlistId)}/songs/${encodeURIComponent(songId)}`)
}

export function reorderPlaylistSongs(id: string, songIds: string[]): Promise<PlaylistDetail> {
  return apiClient.put(`/playlists/${encodeURIComponent(id)}/songs/order`, { songIds })
}
