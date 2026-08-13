import { useAsync } from './useAsync'
import { fetchPlaylist, fetchPlaylists } from '../api/playlists'

export function usePlaylists(page = 0, size = 20) {
  return useAsync(() => fetchPlaylists(page, size), [page, size])
}

export function usePlaylist(id: string) {
  return useAsync(() => fetchPlaylist(id), [id])
}
