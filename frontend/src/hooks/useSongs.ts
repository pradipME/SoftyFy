import { useAsync } from './useAsync'
import { fetchSong, fetchSongs } from '../api/songs'
import type { SongSortOption } from '../types/api'

export function useSongs(page = 0, size = 20, sort?: SongSortOption) {
  return useAsync(() => fetchSongs({ page, size, sort }), [page, size, sort])
}

export function useSong(id: string) {
  return useAsync(() => fetchSong(id), [id])
}
