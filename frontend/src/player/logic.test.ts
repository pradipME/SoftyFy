import { describe, expect, it } from 'vitest'
import {
  buildPlayOrder,
  clamp,
  currentSongOf,
  enableShuffle,
  nextPosition,
  nextRepeatMode,
  previousTarget,
  RESTART_THRESHOLD_SECONDS,
  shuffle,
} from './logic'
import { createInitialState } from './reducer'
import type { PlayerState } from './types'

const song = (id: string) => ({
  id,
  title: `Song ${id}`,
  artistNames: ['Artist'],
  albumId: null,
  albumTitle: null,
  durationSeconds: 180,
})

describe('clamp', () => {
  it('clamps values into the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('handles non-finite values by returning the min', () => {
    expect(clamp(Number.NaN, 0, 10)).toBe(0)
    expect(clamp(Number.POSITIVE_INFINITY, 0, 10)).toBe(0)
  })
})

describe('currentSongOf', () => {
  it('returns the song at the current derived position', () => {
    const state = createInitialState()
    state.queue = [song('a'), song('b')]
    state.playOrder = [1, 0]
    state.position = 0
    expect(currentSongOf(state)?.id).toBe('b')
  })

  it('returns null for an empty or out-of-range queue', () => {
    expect(currentSongOf(createInitialState())).toBeNull()
    const state = createInitialState()
    state.queue = [song('a')]
    state.playOrder = [0]
    state.position = 5
    expect(currentSongOf(state)).toBeNull()
  })
})

describe('buildPlayOrder', () => {
  it('builds an identity order when shuffle is off', () => {
    const { order, position } = buildPlayOrder(4, 2, false)
    expect(order).toEqual([0, 1, 2, 3])
    expect(position).toBe(2)
  })

  it('keeps the start song first when shuffle is on and shuffles the rest', () => {
    const { order, position } = buildPlayOrder(5, 3, true)
    expect(position).toBe(0)
    expect(order[0]).toBe(3)
    expect(order).toHaveLength(5)
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4])
  })

  it('handles an empty queue', () => {
    expect(buildPlayOrder(0, 0, false)).toEqual({ order: [], position: -1 })
    expect(buildPlayOrder(0, 0, true)).toEqual({ order: [], position: -1 })
  })

  it('clamps the start index for a non-shuffled queue', () => {
    expect(buildPlayOrder(3, 99, false).position).toBe(2)
    expect(buildPlayOrder(3, -5, false).position).toBe(0)
  })
})

describe('enableShuffle', () => {
  it('keeps the current song first and never duplicates it', () => {
    const order = [0, 1, 2, 3, 4]
    const { order: shuffled, position } = enableShuffle(order, 2)
    expect(position).toBe(0)
    expect(shuffled[0]).toBe(2)
    expect(shuffled).toHaveLength(5)
    expect(new Set(shuffled).size).toBe(5)
  })

  it('handles an empty order', () => {
    expect(enableShuffle([], -1)).toEqual({ order: [], position: -1 })
  })
})

describe('shuffle', () => {
  it('returns a permutation of the input without mutating it', () => {
    const input = [1, 2, 3, 4, 5]
    const output = shuffle(input)
    expect([...output].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})

describe('nextPosition', () => {
  const state = (position: number, repeatMode: 'off' | 'all' | 'one', length: number) =>
    ({
      playOrder: Array.from({ length }, (_, i) => i),
      position,
      repeatMode,
    }) as const

  it('advances normally', () => {
    expect(nextPosition(state(0, 'off', 3))).toBe(1)
  })

  it('stops at the end of the queue when repeat is off', () => {
    expect(nextPosition(state(2, 'off', 3))).toBeNull()
  })

  it('wraps to the start when repeat is all', () => {
    expect(nextPosition(state(2, 'all', 3))).toBe(0)
  })

  it('repeats the current position when repeat is one', () => {
    expect(nextPosition(state(1, 'one', 3))).toBe(1)
  })

  it('returns null for an empty queue', () => {
    expect(nextPosition({ playOrder: [], position: -1, repeatMode: 'all' })).toBeNull()
  })
})

describe('previousTarget', () => {
  const state: Pick<PlayerState, 'playOrder' | 'position'> = { playOrder: [0, 1, 2], position: 1 }

  it('restarts the current song after the threshold', () => {
    expect(previousTarget(state, RESTART_THRESHOLD_SECONDS + 1)).toEqual({
      position: 1,
      restart: true,
    })
  })

  it('moves to the previous song before the threshold', () => {
    expect(previousTarget(state, 0.5)).toEqual({ position: 0, restart: false })
  })

  it('restarts when already at the start of the queue', () => {
    const atStart: Pick<PlayerState, 'playOrder' | 'position'> = { playOrder: [0, 1, 2], position: 0 }
    expect(previousTarget(atStart, 0.5)).toEqual({ position: 0, restart: true })
  })

  it('handles an empty queue', () => {
    expect(previousTarget({ playOrder: [], position: -1 }, 0)).toEqual({
      position: -1,
      restart: false,
    })
  })
})

describe('nextRepeatMode', () => {
  it('cycles off -> all -> one -> off', () => {
    expect(nextRepeatMode('off')).toBe('all')
    expect(nextRepeatMode('all')).toBe('one')
    expect(nextRepeatMode('one')).toBe('off')
  })
})
