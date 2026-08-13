import type { PlayerState, QueueItem, RepeatMode } from './types'

export const DEFAULT_PLAYBACK_ERROR = 'Unable to play this song.'

export const RESTART_THRESHOLD_SECONDS = 3

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function currentSongOf(
  state: Pick<PlayerState, 'queue' | 'playOrder' | 'position'>,
): QueueItem | null {
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
export function buildPlayOrder(length: number, startIndex: number, shuffleEnabled: boolean): BuiltOrder {
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
  state: Pick<PlayerState, 'playOrder' | 'position' | 'repeatMode'>,
): number | null {
  if (state.playOrder.length === 0) return null
  if (state.repeatMode === 'one') return state.position
  const next = state.position + 1
  if (next < state.playOrder.length) return next
  if (state.repeatMode === 'all') return 0
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
