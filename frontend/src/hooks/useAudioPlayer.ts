import { useCallback, useEffect, useRef } from 'react'
import type { PlaybackStatus } from '../context/playerReducer'
import {
  bufferedAheadOf,
  bufferedMeasurableAhead,
  bufferedRangesText,
  connectionSummary,
  logApp,
  round,
} from '../lib/mediaDebug'

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

const STALL_TIMEOUT_MS = 10_000
const MAX_RECOVERY_ATTEMPTS = 3
const NEAR_END_THRESHOLD_S = 2
/** Base delay for retrying a single (the only) candidate URL. Doubles per
 *  attempt, capped at 4 s, so a dead stream is not hammered into an instant
 *  reload loop. */
const RECOVERY_BACKOFF_MS = 1000
const RECOVERY_BACKOFF_MAX_MS = 4000

/** How recently a `timeupdate` must have advanced currentTime to count as real
 *  playback progress. onPlaying/onCanPlay only disarm the stall watchdog when
 *  there is such evidence, so a thin-buffer "flutter" that never makes progress
 *  cannot keep resetting the 10 s escalation clock forever. */
const PROGRESS_EVIDENCE_MS = 1500

/** Minimum buffer (seconds) required before a fresh song is reported "playing". */
const MIN_START_BUFFER_S = 5
const BUFFER_GUARD_POLL_MS = 300
const BUFFER_GUARD_MAX_MS = 12_000

/**
 * Wraps a single shared HTMLAudioElement. The PlayerProvider owns the result,
 * so exactly one audio element lives for the whole app and playback survives
 * page navigation.
 *
 * `loadAndPlay(songId, srcs, startAt, shouldPlay)` is the only playback entry
 * point. `srcs` is an ordered list of URLs for one song (see
 * `buildAudioCandidates`). Drive songs deliberately have exactly ONE candidate
 * — the official `?alt=media&key=` URL — because every fallback host measured
 * during the original playback fix 403s / 404s / CORS-fails in real browsers
 * (project report §4.1). The first URL is therefore the only URL tried; a
 * different source list — a new song or a re-selected one — resets the list
 * back to its first entry.
 *
 * ## Stall / error recovery
 * When the network stalls mid-playback (`waiting` / `stalled`) a watchdog
 * timer starts; if no progress happens within {@link STALL_TIMEOUT_MS} we
 * force-recover by re-loading the current URL, preserving the playback
 * position. Drive throttles some connections so slowly that only `waiting`
 * fires (never `stalled`), so both events arm the watchdog. Transient media
 * errors do the same. Because every source list is a single entry, recovery
 * retries that one URL with escalating backoff up to
 * {@link MAX_RECOVERY_ATTEMPTS} times before `onError` fires so the UI can
 * give up.
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
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const recoveringRef = useRef(false)
  const stallFlagRef = useRef(false)
  const pendingStartBufferRef = useRef(false)
  const bufferGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bufferGuardDeadlineRef = useRef(0)
  const lastEventLogAtRef = useRef<Record<string, number>>({})
  /** Wall-clock time / currentTime of the last `timeupdate` that advanced
   *  currentTime. Used to prove real playback progress before the stall
   *  watchdog is disarmed. */
  const lastProgressAtRef = useRef(0)
  const lastProgressValueRef = useRef(0)

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current !== null) {
      clearTimeout(stallTimerRef.current)
      stallTimerRef.current = null
    }
  }, [])

  const clearRecoveryTimer = useCallback(() => {
    if (recoveryTimerRef.current !== null) {
      clearTimeout(recoveryTimerRef.current)
      recoveryTimerRef.current = null
    }
  }, [])

  const clearBufferGuard = useCallback(() => {
    pendingStartBufferRef.current = false
    if (bufferGuardTimerRef.current !== null) {
      clearTimeout(bufferGuardTimerRef.current)
      bufferGuardTimerRef.current = null
    }
  }, [])

  /** Buffer is healthy - transition to 'playing' and remember the working URL. */
  const completeBufferedStart = useCallback(() => {
    pendingStartBufferRef.current = false
    if (bufferGuardTimerRef.current !== null) {
      clearTimeout(bufferGuardTimerRef.current)
      bufferGuardTimerRef.current = null
    }
    const audio = audioRef.current
    const songId = songIdRef.current
    const src = lastSrcRef.current
    if (audio === null) return
    handlersRef.current.onStatusChange('playing')
    if (songId !== null && src !== null) {
      handlersRef.current.onSourceReady(songId, src)
    }
  }, [])

  /**
   * Initial-startup buffer guard: when a song starts with less than
   * {@link MIN_START_BUFFER_S} of media buffered ahead (cellular, large file,
   * first play), keep the loading state up until there is real runway instead
   * of flagging "playing" exactly at the buffering edge and stalling a moment
   * later. Never blocks forever - past {@link BUFFER_GUARD_MAX_MS} it plays
   * regardless.
   *
   * Critically, the guard chain is armed from `loadAndPlay`/`recoverToCandidate`
   * (not only from the element's `playing` event), so a stall that never
   * reaches `playing` still hits the {@link BUFFER_GUARD_MAX_MS} give-up
   * instead of holding "loading" forever.
   */
  const startBufferedStart = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    const healthy = () => {
      const current = audioRef.current
      if (current === null) return false
      const ahead = bufferedMeasurableAhead(current, current.currentTime)
      return ahead === null || ahead >= MIN_START_BUFFER_S
    }
    const poll = () => {
      bufferGuardTimerRef.current = null
      if (!pendingStartBufferRef.current) return
      const current = audioRef.current
      if (current === null) return
      // A real media error is handled by the onError → recovery path; stop
      // steering status once it has handed over.
      if (current.error !== null) return
      if (current.paused) {
        // Paused while guarding (user or browser) - the pause event already
        // reported 'paused'; stop steering status.
        clearBufferGuard()
        return
      }
      if (healthy() || Date.now() >= bufferGuardDeadlineRef.current) {
        completeBufferedStart()
        return
      }
      bufferGuardTimerRef.current = setTimeout(poll, BUFFER_GUARD_POLL_MS)
    }
    // One self-sustaining poll chain per load (re-entrant calls during a
    // waiting/playing flutter just no-op instead of stacking timers).
    if (bufferGuardTimerRef.current !== null) return
    if (bufferGuardDeadlineRef.current === 0) {
      bufferGuardDeadlineRef.current = Date.now() + BUFFER_GUARD_MAX_MS
    }
    if (healthy()) {
      completeBufferedStart()
      return
    }
    handlersRef.current.onStatusChange('loading')
    bufferGuardTimerRef.current = setTimeout(poll, BUFFER_GUARD_POLL_MS)
  }, [clearBufferGuard, completeBufferedStart])

  /** Debug logging with per-tag throttling (media events can fire in bursts). */
  const logEvent = useCallback((tag: string, data: () => Record<string, unknown>): void => {
    const now = Date.now()
    const last = lastEventLogAtRef.current[tag] ?? 0
    if (now - last < 2000) return
    lastEventLogAtRef.current[tag] = now
    logApp(tag, data())
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
      clearBufferGuard()
      stallFlagRef.current = false
      candidateIndexRef.current = index
      lastSrcRef.current = src
      audio.src = src
      audio.load()

      // The recovered host gets the same startup runway guard + give-up
      // deadline as an initial load, so a flutter on a fallback host can never
      // hold the spinner up forever either.
      pendingStartBufferRef.current = true
      bufferGuardDeadlineRef.current = Date.now() + BUFFER_GUARD_MAX_MS
      startBufferedStart()

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
    [clearStallTimer, clearBufferGuard, startBufferedStart],
  )

  /** Advances to the next URL for the current song, or reports failure. */
  const attemptRecovery = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return

    handlersRef.current.onRecoveryStart()
    clearRecoveryTimer()
    clearBufferGuard()
    clearStallTimer()
    recoveringRef.current = true

    const list = candidatesRef.current
    const currentIndex = candidateIndexRef.current
    const nextIndex = Math.min(currentIndex + 1, list.length - 1)
    const sameHost = nextIndex === currentIndex

    if (sameHost) {
      // Every source list is a single entry now (Drive songs and local files
      // alike), so recovery retries the same URL a bounded number of times
      // with escalating backoff before giving up. No dead hosts to cycle.
      retryCountRef.current += 1
      if (retryCountRef.current > MAX_RECOVERY_ATTEMPTS) {
        retryCountRef.current = 0
        recoveringRef.current = false
        handlersRef.current.onError()
        return
      }
      const savedTime = audio.currentTime
      const delay = Math.min(
        RECOVERY_BACKOFF_MS * 2 ** (retryCountRef.current - 1),
        RECOVERY_BACKOFF_MAX_MS,
      )
      recoveryTimerRef.current = setTimeout(() => {
        recoveryTimerRef.current = null
        recoverToCandidate(nextIndex, savedTime)
      }, delay)
      return
    }

    // Multi-entry lists (only reachable for non-Drive sources that opt in)
    // still skip to the next URL per failure; the list bounds total attempts.
    retryCountRef.current = 0
    recoverToCandidate(nextIndex, audio.currentTime)
  }, [clearRecoveryTimer, clearStallTimer, recoverToCandidate, clearBufferGuard])

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

    const onTimeUpdate = () => {
      handlersRef.current.onTimeUpdate(audio.currentTime)
      // Advancing currentTime is the only hard evidence of real playback — use
      // it to record progress and disarm the stall watchdog.
      if (audio.currentTime !== lastProgressValueRef.current) {
        lastProgressValueRef.current = audio.currentTime
        lastProgressAtRef.current = Date.now()
        clearStallTimer()
      }
    }
    const onSeeked = () => handlersRef.current.onTimeUpdate(audio.currentTime)
    const onLoadedMetadata = () => handlersRef.current.onDurationChange(audio.duration)
    const onDurationChange = () => handlersRef.current.onDurationChange(audio.duration)
    const onPlay = () => handlersRef.current.onStatusChange('playing')
    const onPlaying = () => {
      stallFlagRef.current = false
      retryCountRef.current = 0
      // Only disarm the stall watchdog on evidence of real progress. A
      // thin-buffer flutter (playing → waiting → playing with no currentTime
      // moving) must not keep resetting the 10 s escalation clock on a host
      // that never delivers.
      if (Date.now() - lastProgressAtRef.current < PROGRESS_EVIDENCE_MS) clearStallTimer()
      if (
        pendingStartBufferRef.current &&
        (() => {
          const ahead = bufferedMeasurableAhead(audio, audio.currentTime)
          return ahead !== null && ahead < MIN_START_BUFFER_S
        })()
      ) {
        startBufferedStart()
        return
      }
      pendingStartBufferRef.current = false
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
      logEvent('media.waiting', () => ({
        currentTime: round(audio.currentTime),
        buffered: bufferedRangesText(audio),
        bufferedAhead: round(bufferedAheadOf(audio, audio.currentTime)),
        readyState: audio.readyState,
        ...connectionSummary(),
      }))
      handlersRef.current.onStatusChange('loading')
      armBufferTimer()
    }
    const onStalled = () => {
      if (suppressLoadingRef.current) return
      stallFlagRef.current = true
      logEvent('media.stalled', () => ({
        currentTime: round(audio.currentTime),
        buffered: bufferedRangesText(audio),
        bufferedAhead: round(bufferedAheadOf(audio, audio.currentTime)),
        readyState: audio.readyState,
        ...connectionSummary(),
      }))
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
      // Like onPlaying: only disarm the watchdog when currentTime has really
      // advanced, so a stall that reaches canplay without actually playing
      // still lets the 10 s watchdog escalate.
      if (Date.now() - lastProgressAtRef.current < PROGRESS_EVIDENCE_MS) clearStallTimer()
      if (stallFlagRef.current) {
        stallFlagRef.current = false
        // A stall resolved into playable data. Report the element's REAL state:
        // reporting 'paused' here while the element is actually playing makes
        // PlayerContext's pause-sync effect call audio.pause() mid-song — a
        // silent freeze after any transient buffer blip.
        handlersRef.current.onStatusChange(audio.paused ? 'paused' : 'playing')
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
  }, [attemptRecovery, clearStallTimer, startBufferedStart, logEvent])

  useEffect(() => {
    return () => {
      clearStallTimer()
      clearBufferGuard()
      clearRecoveryTimer()
    }
  }, [clearStallTimer, clearBufferGuard, clearRecoveryTimer])

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
        clearRecoveryTimer()
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
        pendingStartBufferRef.current = true
        bufferGuardDeadlineRef.current = Date.now() + BUFFER_GUARD_MAX_MS
        logApp('media.load', { songId, src: preferred, shouldPlay, candidateCount: srcs.length })
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
        // Arm the initial-runway guard immediately. It must NOT depend on the
        // element ever firing `playing` — a stall that never reaches that event
        // (the Drive slow-trickle / thin-pulse case) would otherwise hold
        // "loading" forever, well past the BUFFER_GUARD_MAX_MS give-up.
        startBufferedStart()
      } else if (srcChanged && !audio.paused) {
        audio.pause()
      }
    },
    [attemptRecovery, clearStallTimer, clearRecoveryTimer, startBufferedStart],
  )

  const clearSource = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    clearStallTimer()
    clearBufferGuard()
    clearRecoveryTimer()
    stallFlagRef.current = false
    retryCountRef.current = 0
    recoveringRef.current = false
    lastSrcRef.current = null
    songIdRef.current = null
    candidatesRef.current = []
    candidateIndexRef.current = 0
    audio.removeAttribute('src')
    audio.load()
  }, [clearStallTimer, clearBufferGuard, clearRecoveryTimer])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio === null) return
    // Suppress loading UI while actively seeking – the audio element may fire
    // waiting/stalled events briefly during a seek, which otherwise would toggle
    // the loading spinner and cause a visual flicker.
    suppressLoadingRef.current = true
    clearBufferGuard()
    try {
      audio.currentTime = time
    } catch {
      // Ignore — nothing is loaded yet.
    }
    // Reset after a short grace period (500 ms) to re‑enable stall handling.
    setTimeout(() => {
      suppressLoadingRef.current = false
    }, 500)
  }, [clearBufferGuard])

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