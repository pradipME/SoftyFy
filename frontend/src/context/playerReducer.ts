import type { Song } from '../types/song'

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'
export type RepeatMode = 'off' | 'all' | 'one'

export interface PlayerState {
  /** Source order of the loaded songs. */
  queue: Song[]
  /** Derived playback order — positions into `queue` (identity when shuffle is off). */
  playOrder: number[]
  /** Current index into `playOrder`. */
  position: number
  status: PlaybackStatus
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  /** One-shot flag that tells the audio layer to start playing the current song. */
  playIntent: { startAt: number | null } | null
  hapticsEnabled: boolean
  error: string | null
}

export interface PersistedPreferences {
  volume?: number
  muted?: boolean
  repeat?: RepeatMode
  shuffle?: boolean
  hapticsEnabled?: boolean
}

export const DEFAULT_PLAYBACK_ERROR = 'Unable to play this song.'
export const RESTART_THRESHOLD_SECONDS = 3

export function createInitialState(preferences: PersistedPreferences = {}): PlayerState {
  return {
    queue: [],
    playOrder: [],
    position: -1,
    status: 'idle',
    currentTime: 0,
    duration: 0,
    volume: preferences.volume ?? 0.8,
    muted: preferences.muted ?? false,
    repeat: preferences.repeat ?? 'off',
    shuffle: preferences.shuffle ?? false,
    hapticsEnabled: preferences.hapticsEnabled ?? false,
    playIntent: null,
    error: null,
  }
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function currentSongOf(
  state: Pick<PlayerState, 'queue' | 'playOrder' | 'position'>,
): Song | null {
  if (state.position < 0 || state.position >= state.playOrder.length) return null
  const index = state.playOrder[state.position]
  if (index < 0 || index >= state.queue.length) return null
  return state.queue[index]
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

export interface BuiltOrder {
  order: number[]
  position: number
}

/**
 * Builds the derived playback order for a fresh queue. With shuffle off the
 * order is identity [0..n-1] and the position is the requested start. With
 * shuffle on the requested song stays first (never repeats immediately) and
 * the rest is shuffled.
 */
export function buildPlayOrder(
  length: number,
  startIndex: number,
  shuffleEnabled: boolean,
): BuiltOrder {
  if (length <= 0) return { order: [], position: -1 }
  const base = Array.from({ length }, (_, i) => i)
  if (!shuffleEnabled) {
    return { order: base, position: clamp(startIndex, 0, length - 1) }
  }
  const rest = shuffle(base.filter((i) => i !== startIndex))
  return { order: [startIndex, ...rest], position: 0 }
}

/**
 * Enables shuffle without losing the currently playing song: it stays first in
 * the derived order, the remaining songs are shuffled behind it.
 */
export function enableShuffle(playOrder: number[], position: number): BuiltOrder {
  if (playOrder.length === 0) return { order: [], position: -1 }
  const current = playOrder[position] ?? playOrder[0]
  return { order: [current, ...shuffle(playOrder.filter((i) => i !== current))], position: 0 }
}

/**
 * Resolves the target position after a song ends or the user presses next.
 * Returns null to signal "stop at the end of the queue".
 */
export function nextPosition(
  state: Pick<PlayerState, 'playOrder' | 'position' | 'repeat'>,
): number | null {
  if (state.playOrder.length === 0) return null
  if (state.repeat === 'one') return state.position
  const next = state.position + 1
  if (next < state.playOrder.length) return next
  if (state.repeat === 'all') return 0
  return null
}

export interface PreviousTarget {
  position: number
  restart: boolean
}

/**
 * Resolves the behavior of the previous button. Past the restart threshold the
 * current song restarts; otherwise we move back one position, restarting when
 * already at the start of the queue.
 */
export function previousTarget(
  state: Pick<PlayerState, 'playOrder' | 'position'>,
  currentTime: number,
): PreviousTarget {
  if (state.playOrder.length === 0) return { position: -1, restart: false }
  if (currentTime > RESTART_THRESHOLD_SECONDS) {
    return { position: state.position, restart: true }
  }
  if (state.position > 0) {
    return { position: state.position - 1, restart: false }
  }
  return { position: state.position, restart: true }
}

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  if (mode === 'off') return 'all'
  if (mode === 'all') return 'one'
  return 'off'
}

export type PlayerAction =
  | { type: 'PLAY_SONG'; queue: Song[]; startIndex: number; startAt?: number | null }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS'; currentTime: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'CYCLE_REPEAT' }
  | { type: 'TOGGLE_HAPTICS' }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SEEK'; time: number }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_STATUS'; status: PlaybackStatus }
  | { type: 'PLAY_FAILED' }
  | { type: 'CONSUME_PLAY_INTENT' }

/** Builds the play intent for NEXT/PREVIOUS, preserving pause state. */
function intentFor(wasPlaying: boolean, restart: boolean): { startAt: number | null } | null {
  if (!wasPlaying) return null
  return { startAt: restart ? 0 : null }
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY_SONG': {
      if (action.queue.length === 0) return state
      const { order, position } = buildPlayOrder(action.queue.length, action.startIndex, state.shuffle)
      return {
        ...state,
        queue: action.queue,
        playOrder: order,
        position,
        status: 'loading',
        currentTime: 0,
        duration: 0,
        playIntent: { startAt: action.startAt ?? null },
        error: null,
      }
    }

    case 'PLAY': {
      if (currentSongOf(state) === null) return state
      const status = state.status === 'playing' ? state.status : 'loading'
      return { ...state, status, playIntent: { startAt: null }, error: null }
    }

    case 'PAUSE': {
      return { ...state, status: 'paused', playIntent: null }
    }

    case 'NEXT': {
      if (state.playOrder.length === 0) return state
      const target = nextPosition(state)
      const wasPlaying = state.status === 'playing' || state.status === 'loading'
      if (target === null) {
        return { ...state, status: 'paused', currentTime: 0, playIntent: null, error: null }
      }
      const restart = target === state.position
      return {
        ...state,
        position: target,
        status: wasPlaying ? 'loading' : 'paused',
        currentTime: 0,
        duration: restart ? state.duration : 0,
        playIntent: intentFor(wasPlaying, restart),
        error: null,
      }
    }

    case 'PREVIOUS': {
      const { position: target, restart } = previousTarget(state, action.currentTime)
      if (target < 0) return state
      const wasPlaying = state.status === 'playing' || state.status === 'loading'
      return {
        ...state,
        position: target,
        status: wasPlaying ? 'loading' : 'paused',
        currentTime: 0,
        duration: restart ? state.duration : 0,
        playIntent: intentFor(wasPlaying, restart),
        error: null,
      }
    }

    case 'TOGGLE_SHUFFLE': {
      if (state.playOrder.length === 0) {
        return { ...state, shuffle: !state.shuffle }
      }
      if (!state.shuffle) {
        const { order, position } = enableShuffle(state.playOrder, state.position)
        return { ...state, shuffle: true, playOrder: order, position }
      }
      const current = state.playOrder[state.position]
      const order = state.queue.map((_, i) => i)
      const position = current !== undefined ? order.indexOf(current) : -1
      return { ...state, shuffle: false, playOrder: order, position }
    }

    case 'CYCLE_REPEAT': {
      return { ...state, repeat: nextRepeatMode(state.repeat) }
    }

    case 'TOGGLE_HAPTICS': {
      return { ...state, hapticsEnabled: !state.hapticsEnabled }
    }

    case 'SET_VOLUME': {
      const volume = clamp(action.volume, 0, 1)
      return { ...state, volume, muted: volume === 0 ? state.muted : false }
    }

    case 'TOGGLE_MUTE': {
      return { ...state, muted: !state.muted }
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
      const duration =
        Number.isFinite(action.duration) && action.duration >= 0 ? action.duration : 0
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
