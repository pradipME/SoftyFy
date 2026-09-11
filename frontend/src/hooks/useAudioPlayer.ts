import { useCallback, useEffect, useRef } from 'react'
import type { PlaybackStatus } from '../context/playerReducer'

export interface AudioPlayerHandlers {
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onStatusChange: (status: PlaybackStatus) => void
  onError: () => void
  onEnded: () => void
  onRecoveryStart: () => void
  /** Called once a source becomes playable so callers remember the working URL. */
  onSourceReady: (songId: string, src: string) => void
}

const STALL_TIMEOUT_MS = 15_000
const MAX_RECOVERY_ATTEMPTS = 3
const NEAR_END_THRESHOLD_S = 2

/**
 * Wraps a single shared HTMLAudioElement. The PlayerProvider owns the result,
 * so exactly one audio element lives for the whole app and playback survives
 * page navigation.
 *
 * `loadAndPlay(songId, srcs, startAt, shouldPlay)` is the only playback entry
 * point. `srcs` is an ordered list of URLs for one song (see
 * `buildAudioCandidates`): the first URL is tried first, then each failing host
 * is skipped in turn. When a different source list is requested — a new song or
 * a re-selected one — the list resets back to its first entry.
 *
 * ## Stall / error recovery
 * When the network stalls mid-playback (`waiting` / `stalled`) a watchdog
 * timer starts; if no progress happens within {@link STALL_TIMEOUT_MS} we
 * force-recover by re-loading the *next* URL in the list, preserving the
 * playback position. Drive throttles some connections so slowly that only
 * `waiting` fires (never `stalled`), so both events arm the watchdog.
 * Transient media errors do the same. Once every URL in a list has failed,
 * `onError` fires so the UI can give up.
 * A single-entry list simply retries the same URL up to
 * {@link MAX_RECOVERY_ATTEMPTS} times before failing, as before.
 */
export function useAudioPlayer(handlers: AudioPlayerHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (audioRef.current === null) {
    audioRef.current = new Audio()
  }

  const lastSrcRef = useRef<string | null>(null)
  const candidatesRef = useRef<string[]>([])
  const candidateIndexRef = useRef(0)
  const songIdRef = useRef<string | null>(null)
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

  /**
   * Loads the candidates list at the given index, seeking back to `savedTime`
   * once playable, then starts playback. Shared by stall recovery, error
   * recovery, and the initial load-with-resume path.
   */
  const recoverToCandidate = useCallback(
    (index: number, savedTime: number) => {
      const audio = audioRef.current
      const src = candidatesRef.current[index]
      if (audio === null || src === undefined) return

      clearStallTimer()
      stallFlagRef.current = false
      candidateIndexRef.current = index
      lastSrcRef.current = src
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
        audio.play().catch((err: unknown) => {
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
      audio.addEventListener('canplay', onCanPlay)
    },
    [clearStallTimer],
  )

  /** Advances to the next URL for the current song, or reports failure. */
  const attemptRecovery = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return

    handlersRef.current.onRecoveryStart()
    recoveringRef.current = true

    const list = candidatesRef.current
    const currentIndex = candidateIndexRef.current
    const nextIndex = Math.min(currentIndex + 1, list.length - 1)
    const sameHost = nextIndex === currentIndex

    if (sameHost) {
      // Single-entry (e.g. local files): retry the same URL a bounded number of
      // times before giving up, mirroring the old behavior.
      retryCountRef.current += 1
      if (retryCountRef.current > MAX_RECOVERY_ATTEMPTS) {
        retryCountRef.current = 0
        recoveringRef.current = false
        clearStallTimer()
        handlersRef.current.onError()
        return
      }
    } else {
      // Multi-host list: each failure just moves to the next URL; the list
      // bounds the total attempts.
      retryCountRef.current = 0
    }

    recoverToCandidate(nextIndex, audio.currentTime)
  }, [clearStallTimer, recoverToCandidate])

  useEffect(() => {
    const audio = audioRef.current
    if (audio === null) return
    audio.preload = 'auto'

    // Watchdog for "buffering that never resolves". Drive throttles some
    // connections so slowly that the element sits in `waiting` and never fires
    // `stalled`; without this nothing ever advances. Armed by both events,
    // disarmed by `playing`/`canplay`/`pause` or when the user pauses.
    const armBufferTimer = () => {
      if (stallTimerRef.current !== null) return
      if (suppressLoadingRef.current) return
      stallTimerRef.current = setTimeout(() => {
        stallTimerRef.current = null
        attemptRecovery()
      }, STALL_TIMEOUT_MS)
    }

    const onTimeUpdate = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onSeeked = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onLoadedMetadata = () => handlersRef.current.onDurationChange(audio.duration)
    const onDurationChange = () => handlersRef.current.onDurationChange(audio.duration)
    const onPlay = () => handlersRef.current.onStatusChange('playing')
    const onPlaying = () => {
      clearStallTimer()
      stallFlagRef.current = false
      retryCountRef.current = 0
      handlersRef.current.onStatusChange('playing')
      if (songIdRef.current !== null && lastSrcRef.current !== null) {
        handlersRef.current.onSourceReady(songIdRef.current, lastSrcRef.current)
      }
    }
    const onPause = () => {
      clearStallTimer()
      if (audio.ended) return
      handlersRef.current.onStatusChange('paused')
    }
    const onWaiting = () => {
      if (suppressLoadingRef.current) return
      stallFlagRef.current = true
      handlersRef.current.onStatusChange('loading')
      armBufferTimer()
    }
    const onStalled = () => {
      if (suppressLoadingRef.current) return
      stallFlagRef.current = true
      handlersRef.current.onStatusChange('loading')
      armBufferTimer()
    }
    const onLoadStart = () => {
      if (suppressLoadingRef.current) return
      handlersRef.current.onStatusChange('loading')
      // Some hosts answer with an error body (e.g. a throttled Drive API URL
      // returning 403 HTML) that the media element never turns into an `error`
      // event — it just sits loading. Arming the watchdog on `loadstart` too
      // guarantees we switch hosts even when no event ever fires.
      armBufferTimer()
    }
    const onCanPlay = () => {
      clearStallTimer()
      if (stallFlagRef.current && !audio.paused) {
        handlersRef.current.onStatusChange('paused')
      }
    }
    const onError = () => {
      clearStallTimer()
      stallFlagRef.current = false
      const mediaError = audio.error
      // MEDIA_ERR_ABORTED fires when *we* reload mid-request — that is not a
      // real failure. Anything else is worth trying on the next URL.
      if (mediaError !== null && mediaError.code === MediaError.MEDIA_ERR_ABORTED) return
      retryCountRef.current = 0
      attemptRecovery()
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
    (songId: string, srcs: string[], startAt: number | null, shouldPlay: boolean) => {
      const audio = audioRef.current
      if (audio === null) return
      if (srcs.length === 0) return
      const preferred = srcs[0]
      const srcChanged = lastSrcRef.current !== preferred
      if (srcChanged) {
        lastSrcRef.current = preferred
        songIdRef.current = songId
        candidatesRef.current = srcs
        candidateIndexRef.current = 0
        suppressLoadingRef.current = !shouldPlay
        clearStallTimer()
        stallFlagRef.current = false
        retryCountRef.current = 0
        recoveringRef.current = false
        audio.src = preferred
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
            attemptRecovery()
          })
        }
      } else if (srcChanged && !audio.paused) {
        audio.pause()
      }
    },
    [attemptRecovery, clearStallTimer],
  )

  const clearSource = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    clearStallTimer()
    stallFlagRef.current = false
    retryCountRef.current = 0
    recoveringRef.current = false
    lastSrcRef.current = null
    songIdRef.current = null
    candidatesRef.current = []
    candidateIndexRef.current = 0
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