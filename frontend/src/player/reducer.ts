import {
  DEFAULT_PLAYBACK_ERROR,
  buildPlayOrder,
  clamp,
  enableShuffle,
  nextPosition,
  nextRepeatMode,
  previousTarget,
} from './logic'
import { DEFAULT_PREFERENCES, type PersistedPreferences } from './persistence'
import type { PlaybackStatus, PlayerState, QueueItem, RepeatMode } from './types'

export function createInitialState(
  preferences: PersistedPreferences = DEFAULT_PREFERENCES,
): PlayerState {
  return {
    queue: [],
    playOrder: [],
    position: -1,
    shuffleEnabled: preferences.shuffleEnabled,
    repeatMode: preferences.repeatMode,
    status: 'idle',
    currentTime: 0,
    duration: 0,
    volume: preferences.volume,
    isMuted: preferences.isMuted,
    playIntent: null,
    error: null,
  }
}

export type PlayerAction =
  | { type: 'PLAY_SONG'; queue: QueueItem[]; startIndex: number; shuffleEnabled: boolean }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS'; currentTime: number }
  | { type: 'PLAY_AT'; position: number }
  | { type: 'ADD_TO_QUEUE'; songs: QueueItem[] }
  | { type: 'REMOVE_FROM_QUEUE'; songId: string }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'REORDER_QUEUE'; fromPosition: number; toPosition: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'CYCLE_REPEAT' }
  | { type: 'SET_REPEAT'; repeatMode: RepeatMode }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SEEK'; time: number }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_STATUS'; status: PlaybackStatus }
  | { type: 'PLAY_FAILED' }
  | { type: 'CONSUME_PLAY_INTENT' }

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY_SONG': {
      const { order, position } = buildPlayOrder(
        action.queue.length,
        action.startIndex,
        action.shuffleEnabled,
      )
      return {
        ...state,
        queue: action.queue,
        playOrder: order,
        position,
        status: 'loading',
        currentTime: 0,
        duration: 0,
        playIntent: { startAt: null },
        error: null,
      }
    }

    case 'PLAY': {
      if (state.queue.length === 0) return state
      const status = state.status === 'playing' ? state.status : 'loading'
      return { ...state, status, playIntent: { startAt: null }, error: null }
    }

    case 'PAUSE': {
      return { ...state, status: 'paused', playIntent: null }
    }

    case 'NEXT': {
      if (state.playOrder.length === 0) return state
      const target = nextPosition(state)
      if (target === null) {
        return { ...state, status: 'paused', currentTime: 0, playIntent: null, error: null }
      }
      if (target === state.position) {
        return { ...state, currentTime: 0, status: 'loading', playIntent: { startAt: 0 }, error: null }
      }
      return {
        ...state,
        position: target,
        status: 'loading',
        currentTime: 0,
        duration: 0,
        playIntent: { startAt: null },
        error: null,
      }
    }

    case 'PREVIOUS': {
      const { position: target, restart } = previousTarget(state, action.currentTime)
      if (target < 0) return state
      if (restart || target === state.position) {
        return { ...state, currentTime: 0, status: 'loading', playIntent: { startAt: 0 }, error: null }
      }
      return {
        ...state,
        position: target,
        status: 'loading',
        currentTime: 0,
        duration: 0,
        playIntent: { startAt: null },
        error: null,
      }
    }

    case 'PLAY_AT': {
      if (
        state.playOrder.length === 0 ||
        action.position < 0 ||
        action.position >= state.playOrder.length
      ) {
        return state
      }
      return {
        ...state,
        position: action.position,
        status: 'loading',
        currentTime: 0,
        duration: 0,
        playIntent: { startAt: 0 },
        error: null,
      }
    }

    case 'ADD_TO_QUEUE': {
      if (action.songs.length === 0) return state
      const queue = [...state.queue, ...action.songs]
      let playOrder: number[]
      if (state.playOrder.length === 0) {
        const built = buildPlayOrder(queue.length, 0, state.shuffleEnabled)
        playOrder = built.order
      } else {
        playOrder = [...state.playOrder, ...action.songs.map((_, i) => state.queue.length + i)]
      }
      const position = state.position
      return { ...state, queue, playOrder, position, playIntent: null }
    }

    case 'REMOVE_FROM_QUEUE': {
      const index = state.queue.findIndex((song) => song.id === action.songId)
      if (index < 0) return state
      const queue = state.queue.filter((song) => song.id !== action.songId)
      const removedOrderIndex = state.playOrder.indexOf(index)
      const playOrder = state.playOrder
        .filter((value) => value !== index)
        .map((value) => (value > index ? value - 1 : value))
      if (playOrder.length === 0) {
        return {
          ...state,
          queue,
          playOrder,
          position: -1,
          status: 'idle',
          currentTime: 0,
          duration: 0,
          playIntent: null,
          error: null,
        }
      }
      let position = state.position
      if (removedOrderIndex === position) {
        position = Math.min(position, playOrder.length - 1)
        return {
          ...state,
          queue,
          playOrder,
          position,
          status: 'idle',
          currentTime: 0,
          duration: 0,
          playIntent: null,
          error: null,
        }
      }
      if (removedOrderIndex >= 0 && removedOrderIndex < position) {
        position -= 1
      }
      return { ...state, queue, playOrder, position, playIntent: null }
    }

    case 'CLEAR_QUEUE': {
      return {
        ...state,
        queue: [],
        playOrder: [],
        position: -1,
        status: 'idle',
        currentTime: 0,
        duration: 0,
        playIntent: null,
        error: null,
      }
    }

    case 'REORDER_QUEUE': {
      const length = state.playOrder.length
      if (
        length === 0 ||
        action.fromPosition < 0 ||
        action.fromPosition >= length ||
        action.toPosition < 0 ||
        action.toPosition >= length ||
        action.fromPosition === action.toPosition
      ) {
        return state
      }
      const playOrder = [...state.playOrder]
      const [moved] = playOrder.splice(action.fromPosition, 1)
      playOrder.splice(action.toPosition, 0, moved)
      let position = state.position
      if (action.fromPosition === position) {
        position = action.toPosition
      } else if (action.fromPosition < position && action.toPosition >= position) {
        position -= 1
      } else if (action.fromPosition > position && action.toPosition <= position) {
        position += 1
      }
      return { ...state, playOrder, position, playIntent: null }
    }

    case 'TOGGLE_SHUFFLE': {
      if (state.playOrder.length === 0) {
        return { ...state, shuffleEnabled: !state.shuffleEnabled }
      }
      if (!state.shuffleEnabled) {
        const { order, position } = enableShuffle(state.playOrder, state.position)
        return { ...state, shuffleEnabled: true, playOrder: order, position }
      }
      const current = state.playOrder[state.position]
      const order = state.queue.map((_, i) => i)
      const position = current !== undefined ? order.indexOf(current) : -1
      return { ...state, shuffleEnabled: false, playOrder: order, position }
    }

    case 'CYCLE_REPEAT': {
      return { ...state, repeatMode: nextRepeatMode(state.repeatMode) }
    }

    case 'SET_REPEAT': {
      return { ...state, repeatMode: action.repeatMode }
    }

    case 'SET_VOLUME': {
      const volume = clamp(action.volume, 0, 1)
      return {
        ...state,
        volume,
        isMuted: volume === 0 ? state.isMuted : false,
      }
    }

    case 'TOGGLE_MUTE': {
      return { ...state, isMuted: !state.isMuted }
    }

    case 'SEEK': {
      const max = Math.max(0, state.duration)
      return { ...state, currentTime: clamp(action.time, 0, max) }
    }

    case 'SET_CURRENT_TIME': {
      if (!Number.isFinite(action.time) || action.time < 0) return state
      return { ...state, currentTime: action.time }
    }

    case 'SET_DURATION': {
      const duration = Number.isFinite(action.duration) && action.duration >= 0 ? action.duration : 0
      return { ...state, duration }
    }

    case 'SET_STATUS': {
      if (action.status === 'playing') {
        return { ...state, status: 'playing', error: null }
      }
      return { ...state, status: action.status }
    }

    case 'PLAY_FAILED': {
      return { ...state, status: 'error', playIntent: null, error: DEFAULT_PLAYBACK_ERROR }
    }

    case 'CONSUME_PLAY_INTENT': {
      if (state.playIntent === null) return state
      return { ...state, playIntent: null }
    }

    default:
      return state
  }
}
