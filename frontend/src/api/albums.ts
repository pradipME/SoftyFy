import { apiClient } from './client'
import type { PageResponse } from '../types/api'
import type { AlbumDetail, AlbumSummary } from '../types/album'

export function fetchAlbums(page = 0, size = 20): Promise<PageResponse<AlbumSummary>> {
  return apiClient.get(`/albums?page=${page}&size=${size}`)
}

export function fetchAlbum(id: string): Promise<AlbumDetail> {
  return apiClient.get(`/albums/${encodeURIComponent(id)}`)
}
