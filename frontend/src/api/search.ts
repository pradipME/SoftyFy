import { apiClient } from './client'
import type { SearchResults } from '../types/search'

export function searchLibrary(query: string): Promise<SearchResults> {
  return apiClient.get(`/search?q=${encodeURIComponent(query)}`)
}
