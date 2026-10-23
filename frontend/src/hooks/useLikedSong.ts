import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'softyfy:likedSongs'
const EVENT_NAME = 'softyfy:liked-song-change'

function readLikedIds(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Keeps the mini-player and expanded player heart in sync across the app. */
export function useLikedSong(songId: string | undefined) {
  const [liked, setLiked] = useState(() => songId !== undefined && readLikedIds().includes(songId))

  useEffect(() => {
    setLiked(songId !== undefined && readLikedIds().includes(songId))
  }, [songId])

  useEffect(() => {
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; liked: boolean }>).detail
      if (detail?.id === songId) setLiked(detail.liked)
    }
    window.addEventListener(EVENT_NAME, handleChange)
    return () => window.removeEventListener(EVENT_NAME, handleChange)
  }, [songId])

  const toggleLiked = useCallback(() => {
    if (songId === undefined) return
    const ids = readLikedIds()
    const nextLiked = !ids.includes(songId)
    const nextIds = nextLiked ? [...ids, songId] : ids.filter((id) => id !== songId)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds)) } catch { /* Storage can be unavailable. */ }
    setLiked(nextLiked)
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id: songId, liked: nextLiked } }))
  }, [songId])

  return { liked, toggleLiked }
}
