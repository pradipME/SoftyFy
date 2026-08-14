import { useCallback, useEffect, useRef } from 'react'
import type { PlaybackStatus } from '../context/playerReducer'

export interface AudioPlayerHandlers {
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onStatusChange: (status: PlaybackStatus) => void
  onError: () => void
  onEnded: () => void
}

/**
 * Wraps a single shared HTMLAudioElement. The PlayerProvider owns the result,
 * so exactly one audio element lives for the whole app and playback survives
 * page navigation.
 *
 * `loadAndPlay(src, startAt, shouldPlay)` is the only playback entry point:
 *  - if `src` changed, the new source is loaded (a paused load stays paused),
 *  - `startAt` seeks before playback,
 *  - `shouldPlay` triggers play() and reports autoplay-rejection failures.
 */
export function useAudioPlayer(handlers: AudioPlayerHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (audioRef.current === null) {
    audioRef.current = new Audio()
  }

  const lastSrcRef = useRef<string | null>(null)
  const suppressLoadingRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (audio === null) return
    audio.preload = 'metadata'

    const onTimeUpdate = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onSeeked = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onLoadedMetadata = () => handlersRef.current.onDurationChange(audio.duration)
    const onDurationChange = () => handlersRef.current.onDurationChange(audio.duration)
    const onPlay = () => handlersRef.current.onStatusChange('playing')
    const onPlaying = () => handlersRef.current.onStatusChange('playing')
    const onPause = () => {
      if (audio.ended) return
      handlersRef.current.onStatusChange('paused')
    }
    const onWaiting = () => {
      if (suppressLoadingRef.current) return
      handlersRef.current.onStatusChange('loading')
    }
    const onStalled = () => {
      if (suppressLoadingRef.current) return
      handlersRef.current.onStatusChange('loading')
    }
    const onLoadStart = () => {
      if (suppressLoadingRef.current) return
      handlersRef.current.onStatusChange('loading')
    }
    const onError = () => handlersRef.current.onError()
    const onEnded = () => handlersRef.current.onEnded()

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('seeked', onSeeked)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('stalled', onStalled)
    audio.addEventListener('loadstart', onLoadStart)
    audio.addEventListener('error', onError)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('seeked', onSeeked)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('stalled', onStalled)
      audio.removeEventListener('loadstart', onLoadStart)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const loadAndPlay = useCallback(
    (src: string, startAt: number | null, shouldPlay: boolean) => {
      const audio = audioRef.current
      if (audio === null) return
      const srcChanged = lastSrcRef.current !== src
      if (srcChanged) {
        lastSrcRef.current = src
        suppressLoadingRef.current = !shouldPlay
        audio.src = src
        audio.load()
      }
      if (startAt != null && startAt > 0) {
        try {
          audio.currentTime = startAt
        } catch {
          // Not seekable yet — metadata is still loading.
        }
      }
      if (shouldPlay) {
        suppressLoadingRef.current = false
        const promise = audio.play()
        if (promise !== undefined && typeof promise.catch === 'function') {
          promise.catch((err: unknown) => {
            const isAbort =
              typeof DOMException !== 'undefined' &&
              err instanceof DOMException &&
              err.name === 'AbortError'
            if (isAbort && audio.paused && audio.error === null) {
              handlersRef.current.onStatusChange('paused')
              return
            }
            handlersRef.current.onError()
          })
        }
      } else if (srcChanged && !audio.paused) {
        audio.pause()
      }
    },
    [],
  )

  const clearSource = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    lastSrcRef.current = null
    audio.removeAttribute('src')
    audio.load()
  }, [])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio === null) return
    try {
      audio.currentTime = time
    } catch {
      // Ignore — nothing is loaded yet.
    }
  }, [])

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    if (!audio.paused) audio.pause()
  }, [])

  const setVolume = useCallback((volume: number, muted: boolean) => {
    const audio = audioRef.current
    if (audio === null) return
    audio.volume = volume
    audio.muted = muted
  }, [])

  return { audioRef, loadAndPlay, clearSource, seekTo, pauseAudio, setVolume }
}
