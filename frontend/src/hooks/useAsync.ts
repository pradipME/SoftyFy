import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError } from '../api/client'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  reload: () => void
}

export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    loadRef.current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err: unknown) => {
        if (active) setError(err as ApiError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is the caller-declared dependency list
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { data, loading, error, reload }
}
