import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { streamUrl } from '../lib/stream'
import { clamp, currentSongOf, nextPosition } from '../player/logic'
import { loadPreferences, safeStorage, savePreferences } from '../player/persistence'
import { createInitialState, playerReducer } from '../player/reducer'
import type { PlayerState, QueueItem, RepeatMode } from '../player/types'

export type { PlayerState } from '../player/types'

export interface PlayerApi {
  currentSong: QueueItem | null
  currentSongId: string | null
  status: PlayerState['status']
  playSong: (song: QueueItem, queue: QueueItem[], startIndex: number) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  playAt: (position: number) => void
  addToQueue: (songs: QueueItem[]) => void
  removeFromQueue: (songId: string) => void
  clearQueue: () => void
  reorderQueue: (fromPosition: number, toPosition: number) => void
  seek: (time: number) => void
  seekBy: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  cycleRepeat: () => void
  setRepeatMode: (mode: RepeatMode) => void
  toggleShuffle: () => void
}

const StateContext = createContext<PlayerState | null>(null)
const ApiContext = createContext<PlayerApi | null>(null)

const TIMEUPDATE_THROTTLE_MS = 250

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, undefined, () =>
    createInitialState(loadPreferences(safeStorage())),
  )
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loadedSongIdRef = useRef<string | null>(null)
  const lastTimeUpdateRef = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentSongOf(stateRef.current)) return
    if (audio.error) {
      // Force the next song-load pass to reload the source so retry works
      // after a failed load.
      loadedSongIdRef.current = null
    }
    dispatch({ type: 'PLAY' })
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    dispatch({ type: 'PAUSE' })
  }, [])

  const togglePlay = useCallback(() => {
    if (!currentSongOf(stateRef.current)) return
    if (stateRef.current.status === 'playing') {
      pause()
    } else {
      play()
    }
  }, [pause, play])

  const playSong = useCallback((song: QueueItem, queue: QueueItem[], startIndex: number) => {
    if (currentSongOf(stateRef.current)?.id === song.id) {
      dispatch({ type: 'PLAY' })
      return
    }
    dispatch({ type: 'PLAY_SONG', queue, startIndex, shuffleEnabled: stateRef.current.shuffleEnabled })
  }, [])

  const next = useCallback(() => {
    dispatch({ type: 'NEXT' })
  }, [])

  const previous = useCallback(() => {
    const audio = audioRef.current
    dispatch({ type: 'PREVIOUS', currentTime: audio?.currentTime ?? stateRef.current.currentTime })
  }, [])

  const playAt = useCallback((position: number) => {
    dispatch({ type: 'PLAY_AT', position })
  }, [])

  const addToQueue = useCallback((songs: QueueItem[]) => {
    dispatch({ type: 'ADD_TO_QUEUE', songs })
  }, [])

  const removeFromQueue = useCallback((songId: string) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', songId })
  }, [])

  const clearQueue = useCallback(() => {
    dispatch({ type: 'CLEAR_QUEUE' })
  }, [])

  const reorderQueue = useCallback((fromPosition: number, toPosition: number) => {
    dispatch({ type: 'REORDER_QUEUE', fromPosition, toPosition })
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const s = stateRef.current
    const maxDuration =
      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : s.duration
    const target = clamp(time, 0, Math.max(0, maxDuration))
    audio.currentTime = target
    dispatch({ type: 'SEEK', time: target })
  }, [])

  const seekBy = useCallback(
    (seconds: number) => {
      const audio = audioRef.current
      if (!audio) return
      seek((audio.currentTime ?? stateRef.current.currentTime) + seconds)
    },
    [seek],
  )

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume })
  }, [])

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' })
  }, [])

  const cycleRepeat = useCallback(() => {
    dispatch({ type: 'CYCLE_REPEAT' })
  }, [])

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    dispatch({ type: 'SET_REPEAT', repeatMode: mode })
  }, [])

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
  }, [])

  // One authoritative HTMLAudioElement, owned by the provider. Listeners are
  // attached exactly once; the cleanup removes them so StrictMode re-mounts
  // never register duplicates.
  useEffect(() => {
    if (audioRef.current === null) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
    }
    const audio = audioRef.current

    const onTimeUpdate = () => {
      const now = performance.now()
      if (now - lastTimeUpdateRef.current < TIMEUPDATE_THROTTLE_MS) return
      lastTimeUpdateRef.current = now
      dispatch({ type: 'SET_CURRENT_TIME', time: audio.currentTime })
    }
    const onSeeked = () => dispatch({ type: 'SET_CURRENT_TIME', time: audio.currentTime })
    const onLoadedMetadata = () => dispatch({ type: 'SET_DURATION', duration: audio.duration })
    const onDurationChange = () => dispatch({ type: 'SET_DURATION', duration: audio.duration })
    const onPlay = () => dispatch({ type: 'SET_STATUS', status: 'playing' })
    const onPlaying = () => dispatch({ type: 'SET_STATUS', status: 'playing' })
    const onPause = () => dispatch({ type: 'SET_STATUS', status: 'paused' })
    const onWaiting = () => dispatch({ type: 'SET_STATUS', status: 'loading' })
    const onStalled = () => dispatch({ type: 'SET_STATUS', status: 'loading' })
    const onLoadStart = () => dispatch({ type: 'SET_STATUS', status: 'loading' })
    const onEmpty = () => dispatch({ type: 'SET_STATUS', status: 'idle' })
    const onError = () => dispatch({ type: 'PLAY_FAILED' })
    const onEnded = () => {
      const s = stateRef.current
      const target = nextPosition(s)
      if (target === null) {
        audio.currentTime = 0
        dispatch({ type: 'NEXT' })
        return
      }
      if (target === s.position) {
        audio.currentTime = 0
        dispatch({ type: 'NEXT' })
        return
      }
      dispatch({ type: 'NEXT' })
    }

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
    audio.addEventListener('emptied', onEmpty)
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
      audio.removeEventListener('emptied', onEmpty)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  // The single authoritative song-load pipeline. It loads a source only when
  // the song ID actually changes and consumes the one-shot play intent, so
  // play() is invoked at most once per transition.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const song = currentSongOf(state)
    if (song === null) {
      if (loadedSongIdRef.current !== null) {
        loadedSongIdRef.current = null
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        dispatch({ type: 'SET_STATUS', status: 'idle' })
      }
      return
    }
    if (loadedSongIdRef.current !== song.id) {
      loadedSongIdRef.current = song.id
      audio.src = streamUrl(song.id)
      audio.load()
    }
    const intent = state.playIntent
    if (intent !== null) {
      if (intent.startAt != null) {
        audio.currentTime = intent.startAt
      }
      const playPromise = audio.play()
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch((err: unknown) => {
          const isAbort =
            typeof DOMException !== 'undefined' &&
            err instanceof DOMException &&
            err.name === 'AbortError'
          if (isAbort && audio.paused && audio.error === null) {
            dispatch({ type: 'PAUSE' })
            return
          }
          dispatch({ type: 'PLAY_FAILED' })
        })
      }
      dispatch({ type: 'CONSUME_PLAY_INTENT' })
    }
  }, [state.queue, state.playOrder, state.position, state.playIntent])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = state.volume
    audio.muted = state.isMuted
  }, [state.volume, state.isMuted])

  useEffect(() => {
    savePreferences(
      {
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        shuffleEnabled: state.shuffleEnabled,
      },
      safeStorage(),
    )
  }, [state.volume, state.isMuted, state.repeatMode, state.shuffleEnabled])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => play())
    ms.setActionHandler('pause', () => pause())
    ms.setActionHandler('previoustrack', () => previous())
    ms.setActionHandler('nexttrack', () => next())
    return () => {
      ms.setActionHandler('play', null)
      ms.setActionHandler('pause', null)
      ms.setActionHandler('previoustrack', null)
      ms.setActionHandler('nexttrack', null)
    }
  }, [play, pause, previous, next])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const song = currentSongOf(state)
    ms.metadata =
      song === null
        ? null
        : new MediaMetadata({
            title: song.title,
            artist: song.artistNames.join(', ') || 'Unknown artist',
            album: song.albumTitle ?? '',
            artwork: [],
          })
    ms.playbackState = state.status === 'playing' ? 'playing' : 'paused'
  }, [state.queue, state.playOrder, state.position, state.status])

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
        seekBy(5)
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        seekBy(-5)
      } else if (event.code === 'ArrowUp') {
        event.preventDefault()
        setVolume(stateRef.current.volume + 0.1)
      } else if (event.code === 'ArrowDown') {
        event.preventDefault()
        setVolume(stateRef.current.volume - 0.1)
      } else if (event.key.toLowerCase() === 'm') {
        toggleMute()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, seekBy, setVolume, toggleMute])

  const currentSong = currentSongOf(state)

  const api = useMemo<PlayerApi>(
    () => ({
      currentSong,
      currentSongId: currentSong?.id ?? null,
      status: state.status,
      playSong,
      play,
      pause,
      togglePlay,
      next,
      previous,
      playAt,
      addToQueue,
      removeFromQueue,
      clearQueue,
      reorderQueue,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      cycleRepeat,
      setRepeatMode,
      toggleShuffle,
    }),
    [
      currentSong,
      state.status,
      playSong,
      play,
      pause,
      togglePlay,
      next,
      previous,
      playAt,
      addToQueue,
      removeFromQueue,
      clearQueue,
      reorderQueue,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      cycleRepeat,
      setRepeatMode,
      toggleShuffle,
    ],
  )

  return (
    <StateContext.Provider value={state}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function usePlayerState(): PlayerState {
  const state = useContext(StateContext)
  if (state === null) throw new Error('usePlayerState must be used within an AudioPlayerProvider')
  return state
}

export function usePlayerApi(): PlayerApi {
  const api = useContext(ApiContext)
  if (api === null) throw new Error('usePlayerApi must be used within an AudioPlayerProvider')
  return api
}
