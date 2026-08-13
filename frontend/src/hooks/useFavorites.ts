import { useAsync } from './useAsync'
import { fetchFavorites } from '../api/favorites'

export function useFavorites(page = 0, size = 20) {
  return useAsync(() => fetchFavorites(page, size), [page, size])
}
