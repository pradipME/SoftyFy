import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { addFavorite, fetchFavorites, removeFavorite } from '../api/favorites'

interface FavoritesContextValue {
  ids: ReadonlySet<string>
  ready: boolean
  isFavorite: (songId: string) => boolean
  toggleFavorite: (songId: string) => Promise<void>
  reloadFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

const PAGE_SIZE = 100

async function loadAllFavoriteIds(): Promise<string[]> {
  const collected: string[] = []
  let page = 0
  for (;;) {
    const result = await fetchFavorites(page, PAGE_SIZE)
    collected.push(...result.content.map((favorite) => favorite.songId))
    if (result.last) break
    page += 1
  }
  return collected
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set())
  const [ready, setReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const idsRef = useRef(ids)
  idsRef.current = ids

  useEffect(() => {
    let active = true
    setReady(false)
    loadAllFavoriteIds().then(
      (list) => {
        if (active) {
          setIds(new Set(list))
          setReady(true)
        }
      },
      () => {
        if (active) setReady(true)
      },
    )
    return () => {
      active = false
    }
  }, [reloadKey])

  const reloadFavorites = useCallback(() => setReloadKey((key) => key + 1), [])

  const isFavorite = useCallback((songId: string) => idsRef.current.has(songId), [])

  const toggleFavorite = useCallback(async (songId: string) => {
    const wasFavorite = idsRef.current.has(songId)
    setIds((prev) => {
      const next = new Set(prev)
      if (wasFavorite) next.delete(songId)
      else next.add(songId)
      return next
    })
    try {
      if (wasFavorite) await removeFavorite(songId)
      else await addFavorite(songId)
    } catch (error) {
      setIds((prev) => {
        const next = new Set(prev)
        if (wasFavorite) next.add(songId)
        else next.delete(songId)
        return next
      })
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({ ids, ready, isFavorite, toggleFavorite, reloadFavorites }),
    [ids, ready, isFavorite, toggleFavorite, reloadFavorites],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)
  if (context === null) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
