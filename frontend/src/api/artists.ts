import { apiClient } from './client'
import type { PageResponse } from '../types/api'
import type { ArtistDetail, ArtistListItem } from '../types/artist'

export function fetchArtists(page = 0, size = 20): Promise<PageResponse<ArtistListItem>> {
  return apiClient.get(`/artists?page=${page}&size=${size}`)
}

export function fetchArtist(id: string): Promise<ArtistDetail> {
  return apiClient.get(`/artists/${encodeURIComponent(id)}`)
}
