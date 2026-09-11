import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useBeatHaptics } from '../hooks/useBeatHaptics'
import {
  loadPreferences,
  loadResumePositions,
  removeResumePosition,
  safeStorage,
  savePreferences,
  saveResumePosition,
  type ResumePositions,
} from '../lib/storage'
import type { Song } from '../types/song'
import {
  clamp,
  createInitialState,
  currentSongOf,
  playerReducer,
  type PlaybackStatus,
  type RepeatMode,
} from './playerReducer'

export type { PlaybackStatus, RepeatMode } from './playerReducer'

export interface PlayerApi {
  currentSong: Song | null
  status: PlaybackStatus
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  hapticsEnabled: boolean
  /** Whether the device can vibrate to the beat (Android Chrome only). */
  hapticsSupported: boolean
  error: string | null
  /** Plays `song` within `queue` (the queue is used for next/prev/auto-advance). */
  playSong: (song: Song, queue: Song[]) => void
  /** Increments whenever the user selects a song via `playSong`. */
  selectionEpoch: number
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  toggleHaptics: () => void
  cycleRepeat: () => void
}

const PlayerContext = createContext<PlayerApi | null>(null)

const TIMEUPDATE_THROTTLE_MS = 250
const RESUME_PERSIST_INTERVAL_MS = 10_000
const RESUME_MIN_TIME = 15
const RESUME_MIN_DURATION = 60
const RESUME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, undefined, () =>
    createInitialState(loadPreferences(safeStorage()) ?? {}),
  )
  const stateRef = useRef(state)
  stateRef.current = state

  // Resume-position store (trackId → { time, duration, updatedAt }).
  const resumePositionsRef = useRef<ResumePositions>(loadResumePositions(safeStorage()))
  const lastPersistRef = useRef(0)

  // Bumped on every user-initiated song selection (playSong). Lets the shell
  // react by opening the full Now Playing sheet — auto-advance and
  // next/previous do NOT bump it, so the sheet only opens from selection.
  const [selectionEpoch, setSelectionEpoch] = useState(0)

  const lastTimeUpdateRef = useRef(0)

  const onTimeUpdate = useCallback((time: number) => {
    const now = performance.now()
    if (now - lastTimeUpdateRef.current < TIMEUPDATE_THROTTLE_MS) return
    lastTimeUpdateRef.current = now
    dispatch({ type: 'SET_CURRENT_TIME', time })

    // Sub-throttled resume-position persistence (~every 10s).
    const s = stateRef.current
    if (now - lastPersistRef.current > RESUME_PERSIST_INTERVAL_MS) {
      lastPersistRef.current = now
      const song = currentSongOf(s)
      const duration = s.duration
      if (song !== null && duration > RESUME_MIN_DURATION && time > RESUME_MIN_TIME && time < duration - 10) {
        const positions = { ...resumePositionsRef.current }
        positions[song.id] = { time, duration, updatedAt: Date.now() }
        resumePositionsRef.current = positions
        saveResumePosition(safeStorage(), positions)
      }
    }
  }, [])

  const onDurationChange = useCallback((duration: number) => {
    dispatch({ type: 'SET_DURATION', duration })
  }, [])

  const onStatusChange = useCallback((status: PlaybackStatus) => {
    dispatch({ type: 'SET_STATUS', status })
  }, [])

  const onError = useCallback(() => {
    dispatch({ type: 'PLAY_FAILED' })
  }, [])

  // A song ended: clear its resume entry and let the reducer resolve the next
  // song (auto-advance, repeat, or stop). A subsequent play() on an ended
  // element restarts from the top.
  const onEnded = useCallback(() => {
    const song = currentSongOf(stateRef.current)
    if (song !== null) {
      resumePositionsRef.current = removeResumePosition(safeStorage(), resumePositionsRef.current, song.id)
    }
    dispatch({ type: 'NEXT' })
  }, [])

  // Called by the audio hook when an automatic recovery attempt begins (stall
  // timeout or transient network error). Clears any stale error so the UI
  // shows the loading spinner instead of a dead error state.
  const onRecoveryStart = useCallback(() => {
    dispatch({ type: 'SET_STATUS', status: 'loading' })
  }, [])

  const {
    audioRef,
    loadAndPlay,
    clearSource,
    seekTo,
    pauseAudio,
    setVolume: applyVolume,
    recoverFromBackground,
  } = useAudioPlayer({
    onTimeUpdate,
    onDurationChange,
    onStatusChange,
    onError,
    onEnded,
    onRecoveryStart,
  })

  const { isSupported: hapticsSupported, resume: hapticsResume } = useBeatHaptics(
    audioRef,
    state.status,
    state.hapticsEnabled,
  )

  const playSong = useCallback((song: Song, queue: Song[]) => {
    hapticsResume()
    const current = currentSongOf(stateRef.current)
    if (current?.id === song.id) {
      dispatch({ type: 'PLAY' })
    } else {
      const startIndex = queue.findIndex((s) => s.id === song.id)
      if (startIndex < 0) return
      // Look up saved resume position for this song.
      let startAt: number | undefined
      const saved = resumePositionsRef.current[song.id]
      if (saved) {
        const isFresh = Date.now() - saved.updatedAt < RESUME_MAX_AGE_MS
        if (isFresh && saved.time > RESUME_MIN_TIME && saved.duration > RESUME_MIN_DURATION) {
          startAt = saved.time
        }
      }
      dispatch({ type: 'PLAY_SONG', queue, startIndex, startAt })
    }
    setSelectionEpoch((epoch) => epoch + 1)
  }, [hapticsResume])

  const togglePlay = useCallback(() => {
    if (currentSongOf(stateRef.current) === null) return
    hapticsResume()
    if (stateRef.current.status === 'playing') {
      dispatch({ type: 'PAUSE' })
    } else {
      dispatch({ type: 'PLAY' })
    }
  }, [hapticsResume])

  const next = useCallback(() => {
    hapticsResume()
    dispatch({ type: 'NEXT' })
  }, [hapticsResume])

  const previous = useCallback(() => {
    hapticsResume()
    dispatch({ type: 'PREVIOUS', currentTime: stateRef.current.currentTime })
  }, [hapticsResume])

  const toggleHaptics = useCallback(() => {
    dispatch({ type: 'TOGGLE_HAPTICS' })
  }, [])

  const seek = useCallback(
    (time: number) => {
      const s = stateRef.current
      const target = clamp(time, 0, Math.max(0, s.duration))
      seekTo(target)
      dispatch({ type: 'SEEK', time: target })
    },
    [seekTo],
  )

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume })
  }, [])

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' })
  }, [])

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
  }, [])

  const cycleRepeat = useCallback(() => {
    dispatch({ type: 'CYCLE_REPEAT' })
  }, [])

  // The single song-load pipeline: load a source only when the song id changes
  // and consume the one-shot play intent (so play() runs at most once per
  // transition).
  const { queue, playOrder, position, playIntent } = state
  useEffect(() => {
    const song = currentSongOf({ queue, playOrder, position })
    if (song === null) {
      clearSource()
      return
    }
    loadAndPlay(song.audioSrc, playIntent?.startAt ?? null, playIntent !== null)
    if (playIntent !== null) {
      dispatch({ type: 'CONSUME_PLAY_INTENT' })
    }
  }, [queue, playOrder, position, playIntent, loadAndPlay, clearSource])

  // Pause the real <audio> element whenever the reducer resolves to a paused
  // state (user pause, or next/previous that must stay stopped). The load
  // pipeline above only reacts to queue/position/intent changes, so without
  // this the element keeps playing while the UI reports paused.
  useEffect(() => {
    if (state.status === 'paused') pauseAudio()
  }, [state.status, pauseAudio])

  // Keep the audio element in sync with the volume settings.
  useEffect(() => {
    applyVolume(state.volume, state.muted)
  }, [state.volume, state.muted, applyVolume])

  // Persist playback preferences across sessions.
  useEffect(() => {
    savePreferences(
      {
        volume: state.volume,
        muted: state.muted,
        repeat: state.repeat,
        shuffle: state.shuffle,
        hapticsEnabled: state.hapticsEnabled,
      },
      safeStorage(),
    )
  }, [state.volume, state.muted, state.repeat, state.shuffle, state.hapticsEnabled])

  // Persist resume position immediately on pause (covers the "close app while paused" case).
  useEffect(() => {
    const s = stateRef.current
    if (s.status !== 'paused') return
    const song = currentSongOf(s)
    const { duration, currentTime } = s
    if (song !== null && duration > RESUME_MIN_DURATION && currentTime > RESUME_MIN_TIME && currentTime < duration - 10) {
      const positions = { ...resumePositionsRef.current }
      positions[song.id] = { time: currentTime, duration, updatedAt: Date.now() }
      resumePositionsRef.current = positions
      saveResumePosition(safeStorage(), positions)
    }
  }, [])

  // Persist resume position on pagehide (browser tab close / navigation).
  useEffect(() => {
    const onPageHide = () => {
      const s = stateRef.current
      const song = currentSongOf(s)
      const { duration, currentTime } = s
      if (song !== null && duration > RESUME_MIN_DURATION && currentTime > RESUME_MIN_TIME && currentTime < duration - 10) {
        const positions = { ...resumePositionsRef.current }
        positions[song.id] = { time: currentTime, duration, updatedAt: Date.now() }
        resumePositionsRef.current = positions
        saveResumePosition(safeStorage(), positions)
      }
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  const currentSong = currentSongOf(state)

  // Media Session API — lockscreen / OS media controls where available.
  // Every handler delegates to the exact same functions the in-app buttons
  // use (togglePlay/previous/next/seek), so there is no duplicated logic.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const seekBy = (offsetSeconds: number) => {
      seek(stateRef.current.currentTime + offsetSeconds)
    }
    ms.setActionHandler('play', () => togglePlay())
    ms.setActionHandler('pause', () => togglePlay())
    ms.setActionHandler('previoustrack', () => previous())
    ms.setActionHandler('nexttrack', () => next())
    ms.setActionHandler('seekbackward', (details) => seekBy(-(details.seekOffset ?? 10)))
    ms.setActionHandler('seekforward', (details) => seekBy(details.seekOffset ?? 10))
    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) seek(details.seekTime)
    })
    return () => {
      ms.setActionHandler('play', null)
      ms.setActionHandler('pause', null)
      ms.setActionHandler('previoustrack', null)
      ms.setActionHandler('nexttrack', null)
      ms.setActionHandler('seekbackward', null)
      ms.setActionHandler('seekforward', null)
      ms.setActionHandler('seekto', null)
    }
  }, [togglePlay, previous, next, seek])

  // Keep the OS metadata in sync with the current song. Artwork `src` is
  // resolved to an absolute URL — some browsers ignore relative paths here.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    if (currentSong === null) {
      ms.metadata = null
      return
    }
    let artworkSrc = currentSong.coverSrc
    try {
      artworkSrc = new URL(currentSong.coverSrc, window.location.origin).href
    } catch {
      // Fall back to the raw path if resolution ever fails.
    }
    ms.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album ?? '',
      artwork: [
        { src: artworkSrc, sizes: '96x96', type: 'image/jpeg' },
        { src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
        { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
      ],
    })
  }, [currentSong])

  // Reflect the real play state in the OS UI (pause icon while playing, etc.).
  // 'loading' leads straight into playback, so keep the OS showing "playing".
  // With no song the session is inactive ('none'), which hides stale controls.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    if (currentSong === null) {
      ms.playbackState = 'none'
      return
    }
    ms.playbackState =
      state.status === 'playing' || state.status === 'loading' ? 'playing' : 'paused'
  }, [state.status, currentSong])

  // Keep the OS seek-bar position in sync where setPositionState is supported.
  // Some engines throw for invalid values, so guard the API and finite input.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    if (currentSong === null || typeof ms.setPositionState !== 'function') return
    const { duration, currentTime } = state
    if (!Number.isFinite(duration) || duration <= 0) return
    try {
      ms.setPositionState({
        duration,
        position: Math.min(Math.max(currentTime, 0), duration),
        playbackRate: 1,
      })
    } catch {
      // Non-finite positions (e.g. an unseekable stream) are rejected by the
      // browser — ignore so the session keeps working.
    }
  }, [state, currentSong])

  // Global keyboard shortcuts (Space, arrows, M) — ignored while typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON' ||
          tag === 'A' ||
          target.isContentEditable
        ) {
          return
        }
      }
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      } else if (event.code === 'ArrowRight') {
        event.preventDefault()
        seek(stateRef.current.currentTime + 5)
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        seek(stateRef.current.currentTime - 5)
      } else if (event.key.toLowerCase() === 'm') {
        toggleMute()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, seek, toggleMute])

  // Recover from missed playback events when the page becomes visible again.
  // Mobile browsers suspend JavaScript timers and may skip/delay the native
  // `ended` event when the screen is locked or the tab is backgrounded, even
  // though the <audio> element keeps playing.  When the user returns, we check
  // whether the song ended (or is essentially at the end) and manually trigger
  // auto-advance, or resume playback if the browser paused the element.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) return
      recoverFromBackground()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [recoverFromBackground])

  const api = useMemo<PlayerApi>(
    () => ({
      currentSong,
      status: state.status,
      currentTime: state.currentTime,
      duration: state.duration,
      volume: state.volume,
      muted: state.muted,
      shuffle: state.shuffle,
      repeat: state.repeat,
      hapticsEnabled: state.hapticsEnabled,
      hapticsSupported,
      error: state.error,
      playSong,
      selectionEpoch,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      toggleHaptics,
      cycleRepeat,
    }),
    [
      currentSong,
      state.status,
      state.currentTime,
      state.duration,
      state.volume,
      state.muted,
      state.shuffle,
      state.repeat,
      state.hapticsEnabled,
      hapticsSupported,
      state.error,
      playSong,
      selectionEpoch,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      toggleHaptics,
      cycleRepeat,
    ],
  )

  return <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerApi {
  const api = useContext(PlayerContext)
  if (api === null) throw new Error('usePlayer must be used within a PlayerProvider')
  return api
}
