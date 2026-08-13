import { useAsync } from './useAsync'
import { fetchArtist, fetchArtists } from '../api/artists'

export function useArtists(page = 0, size = 20) {
  return useAsync(() => fetchArtists(page, size), [page, size])
}

export function useArtist(id: string) {
  return useAsync(() => fetchArtist(id), [id])
}
