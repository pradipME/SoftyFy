import { useCallback, useEffect, useRef } from 'react'
import type { PlaybackStatus } from '../context/playerReducer'
import { fillAudioCache } from '../lib/audioCache'

export interface AudioPlayerHandlers {
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onStatusChange: (status: PlaybackStatus) => void
  onError: () => void
  onEnded: () => void
  onRecoveryStart: () => void
}

const STALL_TIMEOUT_MS = 10_000
const MAX_RECOVERY_ATTEMPTS = 3
const NEAR_END_THRESHOLD_S = 2

/**
 * Wraps a single shared HTMLAudioElement. The PlayerProvider owns the result,
 * so exactly one audio element lives for the whole app and playback survives
 * page navigation.
 *
 * `loadAndPlay(src, startAt, shouldPlay)` is the only playback entry point:
 *  - if `src` changed, the new source is loaded (a paused load stays paused),
 *  - `startAt` seeks before playback,
 *  - `shouldPlay` triggers play() and reports autoplay-rejection failures.
 *
 * ## Stall recovery
 * When the network stalls mid-playback, the browser fires `waiting` / `stalled`.
 * Most browsers recover on their own once data arrives, firing `playing`. If
 * that doesn't happen within {@link STALL_TIMEOUT_MS}, we force-recover by
 * re-setting `audio.src` to the same URL and calling `load()`, which prompts a
 * fresh fetch. The playback position is preserved across the reload.
 *
 * Transient network `error` events (MEDIA_ERR_NETWORK) are also retried with
 * the same strategy, up to {@link MAX_RECOVERY_ATTEMPTS} times. Fatal errors
 * (MEDIA_ERR_DECODE / MEDIA_ERR_SRC_NOT_SUPPORTED) fail immediately.
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
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const recoveringRef = useRef(false)
  const stallFlagRef = useRef(false)

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current !== null) {
      clearTimeout(stallTimerRef.current)
      stallTimerRef.current = null
    }
  }, [])

  const attemptRecovery = useCallback(() => {
    const audio = audioRef.current
    const src = lastSrcRef.current
    if (audio === null || src === null) return

    clearStallTimer()
    stallFlagRef.current = false
    recoveringRef.current = true
    handlersRef.current.onRecoveryStart()

    const savedTime = audio.currentTime
    audio.src = src
    audio.load()

    const onCanPlay = () => {
      audio.removeEventListener('canplay', onCanPlay)
      try {
        audio.currentTime = savedTime
      } catch {
        // Not seekable yet.
      }
      recoveringRef.current = false
      audio.play().catch(() => {})
    }
    audio.addEventListener('canplay', onCanPlay)
  }, [clearStallTimer])

  useEffect(() => {
    const audio = audioRef.current
    if (audio === null) return
    audio.preload = 'metadata'

    const onTimeUpdate = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onSeeked = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onLoadedMetadata = () => handlersRef.current.onDurationChange(audio.duration)
    const onDurationChange = () => handlersRef.current.onDurationChange(audio.duration)
    const onPlay = () => handlersRef.current.onStatusChange('playing')
    const onPlaying = () => {
      stallFlagRef.current = false
      handlersRef.current.onStatusChange('playing')
    }
    const onPause = () => {
      if (audio.ended) return
      handlersRef.current.onStatusChange('paused')
    }
    const onWaiting = () => {
      if (suppressLoadingRef.current) return
      stallFlagRef.current = true
      handlersRef.current.onStatusChange('loading')
    }
    const onStalled = () => {
      if (suppressLoadingRef.current) return
      stallFlagRef.current = true
      handlersRef.current.onStatusChange('loading')

      if (stallTimerRef.current === null) {
        stallTimerRef.current = setTimeout(() => {
          stallTimerRef.current = null
          attemptRecovery()
        }, STALL_TIMEOUT_MS)
      }
    }
    const onLoadStart = () => {
      if (suppressLoadingRef.current) return
      handlersRef.current.onStatusChange('loading')
    }
    const onCanPlay = () => {
      if (stallFlagRef.current && !audio.paused) {
        handlersRef.current.onStatusChange('paused')
      }
    }
    const onError = () => {
      clearStallTimer()
      stallFlagRef.current = false
      const mediaError = audio.error
      const isNetwork =
        mediaError !== null && mediaError.code === MediaError.MEDIA_ERR_NETWORK
      if (isNetwork && retryCountRef.current < MAX_RECOVERY_ATTEMPTS) {
        retryCountRef.current += 1
        attemptRecovery()
        return
      }
      retryCountRef.current = 0
      handlersRef.current.onError()
    }
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
    audio.addEventListener('canplay', onCanPlay)
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
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('ended', onEnded)
    }
  }, [attemptRecovery, clearStallTimer])

  useEffect(() => {
    return () => clearStallTimer()
  }, [clearStallTimer])

  const loadAndPlay = useCallback(
    (src: string, startAt: number | null, shouldPlay: boolean) => {
      const audio = audioRef.current
      if (audio === null) return
      const srcChanged = lastSrcRef.current !== src
      if (srcChanged) {
        lastSrcRef.current = src
        suppressLoadingRef.current = !shouldPlay
        clearStallTimer()
        stallFlagRef.current = false
        retryCountRef.current = 0
        recoveringRef.current = false
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
        fillAudioCache(src)
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
    [clearStallTimer],
  )

  const clearSource = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    clearStallTimer()
    stallFlagRef.current = false
    retryCountRef.current = 0
    recoveringRef.current = false
    lastSrcRef.current = null
    audio.removeAttribute('src')
    audio.load()
  }, [clearStallTimer])

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

  /**
   * Called when the page becomes visible after being hidden (screen unlock,
   * tab switch back). Checks the audio element's actual state and recovers
   * from any missed events:
   *
   * - If the song ended (or is within {@link NEAR_END_THRESHOLD_S} of the
   *   end) while the page was hidden, the `ended` event may not have fired.
   *   Manually dispatch `onEnded` to trigger auto-advance.
   * - If the audio was paused by the browser due to background throttling
   *   (but the UI still expects playback), attempt `audio.play()`.
   */
  const recoverFromBackground = useCallback(() => {
    const audio = audioRef.current
    if (audio === null || audio.readyState === 0) return

    const duration = audio.duration
    const ended = audio.ended
    const nearEnd =
      Number.isFinite(duration) &&
      duration > 0 &&
      audio.currentTime >= duration - NEAR_END_THRESHOLD_S
    const atEnd = Number.isFinite(duration) && duration > 0 && audio.currentTime >= duration

    if (ended || atEnd || nearEnd) {
      handlersRef.current.onEnded()
      return
    }

    if (audio.paused) {
      audio.play().catch(() => {})
    }
  }, [])

  return { audioRef, loadAndPlay, clearSource, seekTo, pauseAudio, setVolume, recoverFromBackground }
}
