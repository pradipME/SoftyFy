import { describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import {
  createInitialState,
  currentSongOf,
  playerReducer,
  type PlayerAction,
  type PlayerState,
} from './playerReducer'

const song = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  durationSec: 180,
  audioSrc: `/audio/${id}.mp3`,
  coverSrc: `/covers/${id}.jpg`,
  library: 'Test',
})

function playAll(state: PlayerState, ids: string[]): PlayerState {
  return playerReducer(state, { type: 'PLAY_SONG', queue: ids.map(song), startIndex: 0 })
}

function reduce(state: PlayerState, actions: PlayerAction[]): PlayerState {
  return actions.reduce((s, action) => playerReducer(s, action), state)
}

describe('playerReducer', () => {
  it('starts empty with sane defaults', () => {
    const state = createInitialState()
    expect(state.queue).toEqual([])
    expect(state.status).toBe('idle')
    expect(state.position).toBe(-1)
    expect(state.volume).toBe(0.8)
    expect(state.muted).toBe(false)
    expect(state.repeat).toBe('off')
    expect(state.shuffle).toBe(false)
    expect(state.currentTime).toBe(0)
    expect(state.duration).toBe(0)
    expect(state.playIntent).toBeNull()
    expect(state.currentQuality).toBeNull()
  })

  it('initializes from persisted preferences', () => {
    const state = createInitialState({ volume: 0.3, muted: true, repeat: 'one', shuffle: true })
    expect(state.volume).toBe(0.3)
    expect(state.muted).toBe(true)
    expect(state.repeat).toBe('one')
    expect(state.shuffle).toBe(true)
  })

  it('PLAY_SONG starts the requested song and sets a play intent', () => {
    const state = playAll(createInitialState(), ['a', 'b', 'c'])
    expect(state.status).toBe('loading')
    expect(state.playIntent).toEqual({ startAt: null })
    expect(currentSongOf(state)?.id).toBe('a')
    expect(state.playOrder).toEqual([0, 1, 2])
  })

  it('PLAY_SONG with startAt sets playIntent.startAt to the given value', () => {
    const state = playerReducer(createInitialState(), {
      type: 'PLAY_SONG',
      queue: ['a'].map(song),
      startIndex: 0,
      startAt: 90,
    })
    expect(state.playIntent).toEqual({ startAt: 90 })
  })

  it('PLAY_SONG with startAt null defaults to startAt null', () => {
    const state = playerReducer(createInitialState(), {
      type: 'PLAY_SONG',
      queue: ['a'].map(song),
      startIndex: 0,
      startAt: null,
    })
    expect(state.playIntent).toEqual({ startAt: null })
  })

  it('PLAY_SONG preserves the shuffle preference and keeps the pick first', () => {
    const base = createInitialState({ shuffle: true })
    const state = playerReducer(base, {
      type: 'PLAY_SONG',
      queue: ['a', 'b', 'c', 'd'].map(song),
      startIndex: 2,
    })
    expect(state.playOrder[0]).toBe(2)
    expect(state.position).toBe(0)
    expect(currentSongOf(state)?.id).toBe('c')
  })

  it('NEXT advances to the next song and keeps playing', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('b')
    expect(state.status).toBe('loading')
    expect(state.playIntent).not.toBeNull()
  })

  it('NEXT while paused moves without resuming playback', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'PAUSE' },
      { type: 'NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('b')
    expect(state.status).toBe('paused')
    expect(state.playIntent).toBeNull()
  })

  it('NEXT with repeat all wraps to the start', () => {
    const base = playAll(createInitialState(), ['a', 'b'])
    const state = reduce(base, [
      { type: 'CYCLE_REPEAT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('a')
  })

  it('NEXT with repeat off stops at the end of the queue', () => {
    const base = playAll(createInitialState(), ['a', 'b'])
    const state = reduce(base, [
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
    ])
    expect(state.status).toBe('paused')
    expect(state.currentTime).toBe(0)
    expect(state.playIntent).toBeNull()
  })

  it('NEXT with repeat one restarts the current song', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'CYCLE_REPEAT' },
      { type: 'CYCLE_REPEAT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('a')
    expect(state.playIntent).toEqual({ startAt: 0 })
  })

  it('AUTO_NEXT advances to the next song and always plays, even from paused', () => {
    // The end-of-song `pause` event can flip status to 'paused' just before
    // the `ended` event is processed; AUTO_NEXT must still auto-advance.
    const state = reduce(playAll(createInitialState(), ['a', 'b', 'c']), [
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'SET_STATUS', status: 'paused' },
      { type: 'AUTO_NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('b')
    expect(state.status).toBe('loading')
    expect(state.playIntent).toEqual({ startAt: null })
  })

  it('AUTO_NEXT with repeat all wraps to the start and plays', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'CYCLE_REPEAT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'AUTO_NEXT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'AUTO_NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('a')
    expect(state.status).toBe('loading')
    expect(state.playIntent).toEqual({ startAt: null })
  })

  it('AUTO_NEXT with repeat one restarts the current song and plays', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'CYCLE_REPEAT' },
      { type: 'CYCLE_REPEAT' },
      { type: 'SET_STATUS', status: 'paused' },
      { type: 'AUTO_NEXT' },
    ])
    expect(currentSongOf(state)?.id).toBe('a')
    expect(state.status).toBe('loading')
    expect(state.playIntent).toEqual({ startAt: 0 })
  })

  it('AUTO_NEXT with repeat off stops at the end of the queue', () => {
    const state = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'AUTO_NEXT' },
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'AUTO_NEXT' },
    ])
    expect(state.status).toBe('paused')
    expect(state.currentTime).toBe(0)
    expect(state.playIntent).toBeNull()
  })

  it('PREVIOUS restarts the current song past the restart threshold', () => {
    const state = playerReducer(playAll(createInitialState(), ['a', 'b']), {
      type: 'PREVIOUS',
      currentTime: 10,
    })
    expect(currentSongOf(state)?.id).toBe('a')
    expect(state.playIntent).toEqual({ startAt: 0 })
  })

  it('PREVIOUS moves back within the restart threshold', () => {
    const base = reduce(playAll(createInitialState(), ['a', 'b']), [
      { type: 'SET_STATUS', status: 'playing' },
      { type: 'NEXT' },
    ])
    expect(currentSongOf(base)?.id).toBe('b')
    const state = playerReducer(base, { type: 'PREVIOUS', currentTime: 1 })
    expect(currentSongOf(state)?.id).toBe('a')
    expect(state.playIntent).toEqual({ startAt: null })
  })

  it('TOGGLE_SHUFFLE keeps the current song and restores order when disabled', () => {
    const base = playAll(createInitialState(), ['a', 'b', 'c', 'd'])
    const shuffled = playerReducer(base, { type: 'TOGGLE_SHUFFLE' })
    expect(shuffled.shuffle).toBe(true)
    expect(shuffled.playOrder[0]).toBe(0)
    const unshuffled = playerReducer(shuffled, { type: 'TOGGLE_SHUFFLE' })
    expect(unshuffled.shuffle).toBe(false)
    expect(unshuffled.playOrder).toEqual([0, 1, 2, 3])
    expect(currentSongOf(unshuffled)?.id).toBe('a')
  })

  it('SEEK clamps to the known duration', () => {
    const state = reduce(playAll(createInitialState(), ['a']), [
      { type: 'SET_DURATION', duration: 180 },
      { type: 'SEEK', time: 999 },
    ])
    expect(state.currentTime).toBe(180)
  })

  it('CYCLE_REPEAT cycles off -> all -> one -> off', () => {
    const s1 = playerReducer(createInitialState(), { type: 'CYCLE_REPEAT' })
    expect(s1.repeat).toBe('all')
    const s2 = playerReducer(s1, { type: 'CYCLE_REPEAT' })
    expect(s2.repeat).toBe('one')
    const s3 = playerReducer(s2, { type: 'CYCLE_REPEAT' })
    expect(s3.repeat).toBe('off')
  })

  it('SET_VOLUME clamps and unmutes when raised above zero', () => {
    const base = createInitialState({ muted: true })
    const state = playerReducer(base, { type: 'SET_VOLUME', volume: 1.5 })
    expect(state.volume).toBe(1)
    expect(state.muted).toBe(false)
  })

  it('PLAY_FAILED records a readable error', () => {
    const state = playerReducer(playAll(createInitialState(), ['a']), { type: 'PLAY_FAILED' })
    expect(state.status).toBe('error')
    expect(state.error).toBeTruthy()
  })

  describe('currentQuality', () => {
    it('SET_QUALITY stores the active tier and reason', () => {
      const withLq = playerReducer(createInitialState(), {
        type: 'SET_QUALITY',
        quality: { quality: 'lq', reason: 'effectiveType:3g' },
      })
      expect(withLq.currentQuality).toEqual({ quality: 'lq', reason: 'effectiveType:3g' })
      const withHq = playerReducer(withLq, {
        type: 'SET_QUALITY',
        quality: { quality: 'hq', reason: 'fast-connection' },
      })
      expect(withHq.currentQuality).toEqual({ quality: 'hq', reason: 'fast-connection' })
      const cleared = playerReducer(withLq, { type: 'SET_QUALITY', quality: null })
      expect(cleared.currentQuality).toBeNull()
    })

    it('PLAY_SONG clears the tier until the next song loads', () => {
      const base = playerReducer(createInitialState(), {
        type: 'SET_QUALITY',
        quality: { quality: 'lq', reason: 'saveData' },
      })
      const state = playAll(base, ['a'])
      expect(state.currentQuality).toBeNull()
    })

    it('NEXT/AUTO_NEXT/PREVIOUS clear the stale tier when the position changes', () => {
      const qualified = (s: PlayerState): PlayerState =>
        playerReducer(s, {
          type: 'SET_QUALITY',
          quality: { quality: 'lq', reason: 'downlink:0.3Mb/s' },
        })
      const loaded = qualified(playAll(createInitialState(), ['a', 'b', 'c']))
      const afterNext = playerReducer(loaded, {
        type: 'SET_QUALITY',
        quality: { quality: 'hq', reason: 'fast-connection' },
      })
      const nexted = playerReducer(afterNext, { type: 'NEXT' })
      expect(nexted.currentQuality).toBeNull()
      const auto = playerReducer(afterNext, { type: 'AUTO_NEXT' })
      expect(auto.currentQuality).toBeNull()
      const back = playerReducer(nexted, { type: 'PREVIOUS', currentTime: 1 })
      expect(back.currentQuality).toBeNull()
    })
  })

  describe('single-song library', () => {
    it('PAUSE stops playback intent for the only track', () => {
      const base = playAll(createInitialState(), ['a'])
      const state = playerReducer(base, { type: 'PAUSE' })
      expect(currentSongOf(state)?.id).toBe('a')
      expect(state.status).toBe('paused')
      expect(state.playIntent).toBeNull()
    })

    it('NEXT with repeat off stops without crashing', () => {
      const state = reduce(playAll(createInitialState(), ['a']), [
        { type: 'SET_STATUS', status: 'playing' },
        { type: 'NEXT' },
      ])
      expect(currentSongOf(state)?.id).toBe('a')
      expect(state.status).toBe('paused')
      expect(state.currentTime).toBe(0)
      expect(state.playIntent).toBeNull()
    })

    it('NEXT with repeat all restarts the only track', () => {
      const state = reduce(playAll(createInitialState(), ['a']), [
        { type: 'CYCLE_REPEAT' },
        { type: 'SET_STATUS', status: 'playing' },
        { type: 'NEXT' },
      ])
      expect(currentSongOf(state)?.id).toBe('a')
      expect(state.status).toBe('loading')
      expect(state.playIntent).toEqual({ startAt: 0 })
    })

    it('PREVIOUS always restarts the only track', () => {
      const state = reduce(playAll(createInitialState(), ['a']), [
        { type: 'SET_STATUS', status: 'playing' },
        { type: 'PREVIOUS', currentTime: 0 },
      ])
      expect(currentSongOf(state)?.id).toBe('a')
      expect(state.status).toBe('loading')
      expect(state.playIntent).toEqual({ startAt: 0 })
    })
  })
})
