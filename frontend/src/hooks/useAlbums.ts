import { useAsync } from './useAsync'
import { fetchAlbum, fetchAlbums } from '../api/albums'

export function useAlbums(page = 0, size = 20) {
  return useAsync(() => fetchAlbums(page, size), [page, size])
}

export function useAlbum(id: string) {
  return useAsync(() => fetchAlbum(id), [id])
}
