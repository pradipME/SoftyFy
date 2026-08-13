import { apiClient } from './client'
import type { PageResponse } from '../types/api'
import type { Favorite } from '../types/favorite'

export function fetchFavorites(page = 0, size = 20): Promise<PageResponse<Favorite>> {
  return apiClient.get(`/favorites?page=${page}&size=${size}`)
}

export function addFavorite(songId: string): Promise<Favorite> {
  return apiClient.post(`/favorites/${encodeURIComponent(songId)}`)
}

export function removeFavorite(songId: string): Promise<void> {
  return apiClient.delete(`/favorites/${encodeURIComponent(songId)}`)
}
