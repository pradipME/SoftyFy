import { describe, expect, it } from 'vitest'
import { DEFAULT_PLAYBACK_ERROR } from './logic'
import { createInitialState, playerReducer, type PlayerAction } from './reducer'
import type { PlayerState, QueueItem } from './types'

const song = (id: string): QueueItem => ({
  id,
  title: `Song ${id}`,
  artistNames: ['Artist'],
  albumId: null,
  albumTitle: null,
  durationSeconds: 180,
})

function playAll(state: PlayerState, ids: string[]): PlayerState {
  return playerReducer(state, {
    type: 'PLAY_SONG',
    queue: ids.map(song),
    startIndex: 0,
    shuffleEnabled: false,
  })
}

function reduce(state: PlayerState, actions: PlayerAction[]): PlayerState {
  return actions.reduce((s, action) => playerReducer(s, action), state)
}

const songIds = (state: PlayerState) => state.queue.map((s) => s.id)

describe('playerReducer', () => {
  it('starts empty with sane defaults', () => {
    const state = createInitialState()
    expect(state.queue).toEqual([])
    expect(state.status).toBe('idle')
    expect(state.position).toBe(-1)
    expect(state.volume).toBe(0.8)
    expect(state.isMuted).toBe(false)
    expect(state.repeatMode).toBe('off')
    expect(state.shuffleEnabled).toBe(false)
    expect(state.currentTime).toBe(0)
    expect(state.duration).toBe(0)
    expect(state.playIntent).toBeNull()
  })

  it('initializes from persisted preferences', () => {
    const state = createInitialState({
      volume: 0.3,
      isMuted: true,
      repeatMode: 'one',
      shuffleEnabled: true,
    })
    expect(state.volume).toBe(0.3)
    expect(state.isMuted).toBe(true)
    expect(state.repeatMode).toBe('one')
    expect(state.shuffleEnabled).toBe(true)
  })

  it('PLAY_SONG starts playback with a play intent and loading status', () => {
    const state = playAll(createInitialState(), ['a', 'b', 'c'])
    expect(state.status).toBe('loading')
    expect(state.playIntent).toEqual({ startAt: null })
    expect(state.position).toBe(0)
    expect(songIds(state)).toEqual(['a', 'b', 'c'])
  })

  it('PLAY_SONG from a middle index positions correctly', () => {
    const state = playerReducer(createInitialState(), {
      type: 'PLAY_SONG',
      queue: [song('a'), song('b'), song('c')],
      startIndex: 2,
      shuffleEnabled: false,
    })
    expect(state.position).toBe(2)
  })

  it('PLAY on an empty queue is a no-op', () => {
    const before = createInitialState()
    const after = playerReducer(before, { type: 'PLAY' })
    expect(after).toBe(before)
  })

  it('PLAY resumes with a fresh intent and does not autoplay on ADD_TO_QUEUE', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'PLAY' },
      { type: 'ADD_TO_QUEUE', songs: [song('b')] },
    ])
    expect(state.playIntent).toBeNull()
    expect(songIds(state)).toEqual(['a', 'b'])
    expect(state.position).toBe(0)
  })

  it('PAUSE clears the play intent', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [{ type: 'PAUSE' }])
    expect(state.status).toBe('paused')
    expect(state.playIntent).toBeNull()
  })

  it('NEXT advances to the next song with a fresh intent', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [{ type: 'NEXT' }])
    expect(state.position).toBe(1)
    expect(state.status).toBe('loading')
    expect(state.playIntent).toEqual({ startAt: null })
    expect(state.currentTime).toBe(0)
  })

  it('NEXT at the end stops playback when repeat is off', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'SET_REPEAT', repeatMode: 'off' },
      { type: 'NEXT' },
    ])
    expect(state.position).toBe(0)
    expect(state.status).toBe('paused')
    expect(state.playIntent).toBeNull()
    expect(state.currentTime).toBe(0)
  })

  it('NEXT wraps around when repeat is all', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'NEXT' },
      { type: 'SET_REPEAT', repeatMode: 'all' },
      { type: 'NEXT' },
    ])
    expect(state.position).toBe(0)
  })

  it('NEXT restarts the same song when repeat is one', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'SET_REPEAT', repeatMode: 'one' },
      { type: 'NEXT' },
    ])
    expect(state.position).toBe(0)
    expect(state.playIntent).toEqual({ startAt: 0 })
    expect(state.currentTime).toBe(0)
  })

  it('PREVIOUS restarts the current song after the 3s threshold', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'PREVIOUS', currentTime: 10 },
    ])
    expect(state.position).toBe(0)
    expect(state.playIntent).toEqual({ startAt: 0 })
  })

  it('PREVIOUS moves back before the 3s threshold', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'NEXT' },
      { type: 'PREVIOUS', currentTime: 1 },
    ])
    expect(state.position).toBe(0)
  })

  it('PLAY_AT jumps to a position and restarts it', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'PLAY_AT', position: 2 },
    ])
    expect(state.position).toBe(2)
    expect(state.playIntent).toEqual({ startAt: 0 })
  })

  it('PLAY_AT ignores an out-of-range position', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'PLAY_AT', position: 7 },
    ])
    expect(state.position).toBe(0)
  })

  it('ADD_TO_QUEUE appends without changing the current song or intent', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'ADD_TO_QUEUE', songs: [song('b'), song('c')] },
    ])
    expect(songIds(state)).toEqual(['a', 'b', 'c'])
    expect(state.position).toBe(0)
    expect(state.playIntent).toBeNull()
  })

  it('ADD_TO_QUEUE on an empty queue starts a loading player without autoplay', () => {
    const state = playerReducer(createInitialState(), {
      type: 'ADD_TO_QUEUE',
      songs: [song('a')],
    })
    expect(songIds(state)).toEqual(['a'])
    expect(state.playOrder).toEqual([0])
    expect(state.playIntent).toBeNull()
  })

  it('REMOVE_FROM_QUEUE removes a song and remaps the order', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'REMOVE_FROM_QUEUE', songId: 'b' },
    ])
    expect(songIds(state)).toEqual(['a', 'c'])
    expect(state.playOrder).toEqual([0, 1])
    expect(state.playIntent).toBeNull()
  })

  it('REMOVE_FROM_QUEUE of the current song advances without autoplaying', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'REMOVE_FROM_QUEUE', songId: 'a' },
    ])
    expect(songIds(state)).toEqual(['b', 'c'])
    expect(state.position).toBe(0)
    expect(state.status).toBe('idle')
    expect(state.playIntent).toBeNull()
  })

  it('REMOVE_FROM_QUEUE of the last song empties the queue', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'REMOVE_FROM_QUEUE', songId: 'a' },
    ])
    expect(state.queue).toEqual([])
    expect(state.status).toBe('idle')
    expect(state.position).toBe(-1)
  })

  it('CLEAR_QUEUE resets everything and never autoplays', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'CLEAR_QUEUE' },
    ])
    expect(state.queue).toEqual([])
    expect(state.playOrder).toEqual([])
    expect(state.position).toBe(-1)
    expect(state.status).toBe('idle')
    expect(state.playIntent).toBeNull()
  })

  it('REORDER_QUEUE moves an item and keeps the current song', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'REORDER_QUEUE', fromPosition: 2, toPosition: 0 },
    ])
    expect(state.playOrder).toEqual([2, 0, 1])
    expect(state.position).toBe(1)
    expect(state.playIntent).toBeNull()
  })

  it('TOGGLE_SHUFFLE preserves the current song when enabling', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c', 'd']), [
      { type: 'NEXT' },
      { type: 'TOGGLE_SHUFFLE' },
    ])
    expect(state.shuffleEnabled).toBe(true)
    expect(state.position).toBe(0)
    expect(state.playOrder[0]).toBe(1)
    expect(new Set(state.playOrder).size).toBe(4)
  })

  it('TOGGLE_SHUFFLE restores identity order when disabling', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'NEXT' },
      { type: 'TOGGLE_SHUFFLE' },
      { type: 'TOGGLE_SHUFFLE' },
    ])
    expect(state.shuffleEnabled).toBe(false)
    expect(state.playOrder).toEqual([0, 1, 2])
    expect(state.position).toBe(1)
  })

  it('CYCLE_REPEAT cycles through the modes', () => {
    let state = playAll(createInitialState(), ['a'])
    state = playerReducer(state, { type: 'CYCLE_REPEAT' })
    expect(state.repeatMode).toBe('all')
    state = playerReducer(state, { type: 'CYCLE_REPEAT' })
    expect(state.repeatMode).toBe('one')
    state = playerReducer(state, { type: 'CYCLE_REPEAT' })
    expect(state.repeatMode).toBe('off')
  })

  it('SET_VOLUME clamps and unmutes on a positive volume', () => {
    let state = playAll(createInitialState(), ['a'])
    state = playerReducer(state, { type: 'TOGGLE_MUTE' })
    state = playerReducer(state, { type: 'SET_VOLUME', volume: 0.5 })
    expect(state.volume).toBe(0.5)
    expect(state.isMuted).toBe(false)
    state = playerReducer(state, { type: 'SET_VOLUME', volume: 99 })
    expect(state.volume).toBe(1)
    state = playerReducer(state, { type: 'SET_VOLUME', volume: -3 })
    expect(state.volume).toBe(0)
  })

  it('TOGGLE_MUTE flips muted without touching volume', () => {
    let state = playAll(createInitialState(), ['a'])
    state = playerReducer(state, { type: 'TOGGLE_MUTE' })
    expect(state.isMuted).toBe(true)
    expect(state.volume).toBe(0.8)
    state = playerReducer(state, { type: 'TOGGLE_MUTE' })
    expect(state.isMuted).toBe(false)
  })

  it('SEEK clamps into the duration', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'SET_DURATION', duration: 100 },
      { type: 'SEEK', time: 50 },
    ])
    expect(state.currentTime).toBe(50)
    const clamped = playerReducer(state, { type: 'SEEK', time: 500 })
    expect(clamped.currentTime).toBe(100)
  })

  it('SET_CURRENT_TIME ignores non-finite values', () => {
    const base = playAll(createInitialState(), ['a'])
    expect(playerReducer(base, { type: 'SET_CURRENT_TIME', time: 5 }).currentTime).toBe(5)
    expect(playerReducer(base, { type: 'SET_CURRENT_TIME', time: Number.NaN }).currentTime).toBe(0)
  })

  it('SET_DURATION guards NaN', () => {
    const base = playAll(createInitialState(), ['a'])
    expect(playerReducer(base, { type: 'SET_DURATION', duration: Number.NaN }).duration).toBe(0)
    expect(playerReducer(base, { type: 'SET_DURATION', duration: 120 }).duration).toBe(120)
  })

  it('PLAY_FAILED records an error and clears the intent', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [{ type: 'PLAY_FAILED' }])
    expect(state.status).toBe('error')
    expect(state.playIntent).toBeNull()
    expect(state.error).toBe(DEFAULT_PLAYBACK_ERROR)
  })

  it('CONSUME_PLAY_INTENT clears the one-shot intent', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [{ type: 'CONSUME_PLAY_INTENT' }])
    expect(state.playIntent).toBeNull()
  })

  it('handles an empty queue and a single-song queue through next', () => {
    const empty = reduce(createInitialState(), [{ type: 'NEXT' }])
    expect(empty.status).toBe('idle')
    const single = reduce(playAll(createInitialState(), ['a']), [
      { type: 'PLAY' },
      { type: 'NEXT' },
    ])
    expect(single.status).toBe('paused')
    expect(single.position).toBe(0)
  })

  it('previous on an empty queue is a no-op', () => {
    const before = createInitialState()
    const after = playerReducer(before, { type: 'PREVIOUS', currentTime: 1 })
    expect(after).toBe(before)
  })
})
