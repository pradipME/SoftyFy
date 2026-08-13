import { searchLibrary } from '../api/search'
import type { SearchResults } from '../types/search'
import { useAsync } from './useAsync'
import { useDebouncedValue } from './useDebouncedValue'

export function useSearch(query: string, minLength = 2) {
  const debounced = useDebouncedValue(query.trim(), 300)
  const enabled = debounced.length >= minLength

  return useAsync(
    () => {
      if (!enabled) return Promise.resolve({ songs: [], artists: [], albums: [], playlists: [] } satisfies SearchResults)
      return searchLibrary(debounced)
    },
    [debounced, enabled],
  )
}
