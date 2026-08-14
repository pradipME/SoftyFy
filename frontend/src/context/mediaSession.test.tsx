// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import { PlayerProvider, usePlayer } from './PlayerContext'

const song = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  album: 'Album',
  durationSec: 180,
  audioSrc: `/audio/${id}.mp3`,
  coverSrc: `/covers/${id}.jpg`,
})

interface MediaSessionMock {
  metadata: { title: string; artist: string; album: string; artwork: { src: string; sizes: string; type: string }[] } | null
  playbackState: string
  handlers: Map<string, ((details: unknown) => void) | null>
  setActionHandler: (action: string, handler: ((details: unknown) => void) | null) => void
}

let mock: MediaSessionMock
let restoreAudio: (() => void) | null = null

function installMediaSessionMock() {
  mock = {
    metadata: null,
    playbackState: '',
    handlers: new Map(),
    setActionHandler(action, handler) {
      if (handler === null) this.handlers.delete(action)
      else this.handlers.set(action, handler)
    },
  }
  Object.defineProperty(navigator, 'mediaSession', { value: mock, configurable: true })
  Object.defineProperty(globalThis, 'MediaMetadata', {
    configurable: true,
    value: class {
      title: string
      artist: string
      album: string
      artwork: { src: string; sizes: string; type: string }[]
      constructor(init: { title: string; artist: string; album: string; artwork: { src: string; sizes: string; type: string }[] }) {
        this.title = init.title
        this.artist = init.artist
        this.album = init.album
        this.artwork = init.artwork
      }
    },
  })
}

/** Makes the jsdom <audio> drive the player state like a real browser. */
function patchAudio() {
  const origPlay = window.Audio.prototype.play
  const origDuration = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'duration')
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
    configurable: true,
    get: () => 100,
  })
  window.Audio.prototype.play = function play() {
    this.dispatchEvent(new Event('loadedmetadata'))
    this.dispatchEvent(new Event('durationchange'))
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  }
  return () => {
    window.Audio.prototype.play = origPlay
    if (origDuration) Object.defineProperty(HTMLMediaElement.prototype, 'duration', origDuration)
  }
}

beforeEach(() => {
  installMediaSessionMock()
  restoreAudio = patchAudio()
})

afterEach(() => {
  cleanup()
  delete (navigator as { mediaSession?: unknown }).mediaSession
  delete (globalThis as { MediaMetadata?: unknown }).MediaMetadata
  restoreAudio?.()
})

function Probe() {
  const api = usePlayer()
  return (
    <div>
      <div data-testid="title">{api.currentSong?.title ?? 'none'}</div>
      <div data-testid="time">{api.currentTime}</div>
      <button onClick={() => api.playSong(song('A'), [song('A'), song('B')])}>play</button>
    </div>
  )
}

describe('Media Session integration', () => {
  it('publishes metadata, artwork and playback state when a song plays', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    fireEvent.click(screen.getByText('play'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(mock.metadata).not.toBeNull()
    expect(mock.metadata?.title).toBe('Song A')
    expect(mock.metadata?.artist).toBe('Artist')
    expect(mock.metadata?.album).toBe('Album')
    expect(mock.metadata?.artwork).toHaveLength(3)
    for (const art of mock.metadata?.artwork ?? []) {
      expect(art.src).toMatch(/^https?:\/\/[^/]+\/covers\/a\.jpg$/i)
    }
    expect(mock.playbackState).toBe('playing')
  })

  it('registers handlers for play/pause/previous/next/seek', () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    for (const action of ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto']) {
      expect(mock.handlers.has(action)).toBe(true)
    }
  })

  it('delegates the next/previous handlers to the app playback functions', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    fireEvent.click(screen.getByText('play'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByTestId('title').textContent).toBe('Song A')

    await act(async () => {
      mock.handlers.get('nexttrack')?.({})
    })
    expect(screen.getByTestId('title').textContent).toBe('Song B')

    await act(async () => {
      mock.handlers.get('previoustrack')?.({})
    })
    expect(screen.getByTestId('title').textContent).toBe('Song A')
  })

  it('delegates the seekto handler to the app seek function', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    fireEvent.click(screen.getByText('play'))
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      mock.handlers.get('seekto')?.({ seekTime: 42 })
    })
    expect(screen.getByTestId('time').textContent).toBe('42')
  })

  it('keeps the OS play/pause state in sync in both directions', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    fireEvent.click(screen.getByText('play'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(mock.playbackState).toBe('playing')

    await act(async () => {
      mock.handlers.get('pause')?.({})
    })
    expect(mock.playbackState).toBe('paused')

    await act(async () => {
      mock.handlers.get('play')?.({})
    })
    expect(mock.playbackState).toBe('playing')
  })
})
