// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueueItem } from '../player/types'
import { AudioPlayerProvider, usePlayerApi, usePlayerState } from './PlayerContext'

const song = (id: string): QueueItem => ({
  id,
  title: `Song ${id}`,
  artistNames: ['Artist'],
  albumId: null,
  albumTitle: null,
  durationSeconds: 180,
})

const STREAM_URL_PATTERN = /\/api\/songs\/[^/]+\/stream$/

class MockAudioElement extends EventTarget {
  src = ''
  preload = ''
  currentTime = 0
  duration = 0
  volume = 1
  muted = false
  paused = true
  error: { code: number } | null = null
  playCalls = 0
  pauseCalls = 0
  loadCalls = 0
  removeAttributeKeys: string[] = []
  private rejectPlay: boolean

  constructor(rejectPlay = false) {
    super()
    this.rejectPlay = rejectPlay
  }

  play(): Promise<void> {
    this.playCalls += 1
    if (this.rejectPlay) {
      this.paused = true
      this.error = { code: 4 }
      return Promise.reject(new Error('play rejected'))
    }
    this.paused = false
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  }

  pause(): void {
    this.pauseCalls += 1
    this.paused = true
    this.dispatchEvent(new Event('pause'))
  }

  load(): void {
    this.loadCalls += 1
  }

  removeAttribute(name: string): void {
    this.removeAttributeKeys.push(name)
    if (name === 'src') this.src = ''
  }
}

interface AudioInstances {
  instances: MockAudioElement[]
  last: () => MockAudioElement
}

function installAudioStub(rejectPlay = false): AudioInstances {
  const instances: MockAudioElement[] = []
  const ctor = class {
    constructor() {
      const instance = new MockAudioElement(rejectPlay)
      instances.push(instance)
      return instance
    }
  }
  vi.stubGlobal('Audio', ctor)
  return { instances, last: () => instances[instances.length - 1] }
}

function Harness() {
  const state = usePlayerState()
  const api = usePlayerApi()
  const queue = state.playOrder.map((i) => state.queue[i])
  return (
    <div>
      <output data-testid="status">{state.status}</output>
      <output data-testid="current">{api.currentSongId ?? 'none'}</output>
      <output data-testid="intent">{state.playIntent ? 'yes' : 'no'}</output>
      <output data-testid="time">{state.currentTime.toFixed(1)}</output>
      <output data-testid="queue">{queue.map((s) => s?.id).join(',')}</output>
      <button data-testid="play-song-a" onClick={() => api.playSong(song('a'), [song('a'), song('b')], 0)}>
        play-a
      </button>
      <button data-testid="play-song-b" onClick={() => api.playSong(song('b'), [song('a'), song('b')], 1)}>
        play-b
      </button>
      <button data-testid="resume-same" onClick={() => api.playSong(song('a'), [song('a'), song('b')], 0)}>
        resume-a
      </button>
      <button data-testid="play" onClick={() => api.play()}>
        play
      </button>
      <button data-testid="pause" onClick={() => api.pause()}>
        pause
      </button>
      <button data-testid="next" onClick={() => api.next()}>
        next
      </button>
      <button data-testid="previous" onClick={() => api.previous()}>
        previous
      </button>
      <button data-testid="add-c" onClick={() => api.addToQueue([song('c')])}>
        add-c
      </button>
      <button data-testid="clear" onClick={() => api.clearQueue()}>
        clear
      </button>
      <button data-testid="reject-error" onClick={() => api.toggleMute()}>
        toggle-mute
      </button>
    </div>
  )
}

function renderHarness(options?: { rejectPlay?: boolean; strict?: boolean }) {
  const audio = installAudioStub(options?.rejectPlay)
  const provider = <AudioPlayerProvider><Harness /></AudioPlayerProvider>
  const view = render(options?.strict ? <StrictMode>{provider}</StrictMode> : provider)
  return { view, audio }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AudioPlayerProvider', () => {
  it('creates exactly one audio element and attaches listeners once', async () => {
    const { audio } = renderHarness({ strict: true })
    await act(async () => {})
    expect(audio.instances).toHaveLength(1)
    const element = audio.last()
    expect(element.playCalls).toBe(0)
    expect(screen.getByTestId('status').textContent).toBe('idle')
  })

  it('plays a song via streamUrl and consumes the intent after one play()', async () => {
    const { audio } = renderHarness()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    const element = audio.last()
    expect(element.src).toMatch(STREAM_URL_PATTERN)
    expect(element.src).toContain('/songs/a/stream')
    expect(element.playCalls).toBe(1)
    expect(element.loadCalls).toBe(1)
    expect(screen.getByTestId('status').textContent).toBe('playing')
    expect(screen.getByTestId('current').textContent).toBe('a')
    expect(screen.getByTestId('intent').textContent).toBe('no')
  })

  it('does not autoplay on mount before any interaction', async () => {
    renderHarness()
    await act(async () => {})
    expect(screen.getByTestId('current').textContent).toBe('none')
  })

  it('switches songs with a single src change per song', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    const srcAfterA = element.src
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-b'))
    })
    expect(element.src).not.toBe(srcAfterA)
    expect(element.src).toContain('/songs/b/stream')
    expect(element.loadCalls).toBe(2)
    expect(screen.getByTestId('current').textContent).toBe('b')
  })

  it('resumes the same song without reloading its source', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    const srcAfterA = element.src
    const loadAfterA = element.loadCalls
    await act(async () => {
      fireEvent.click(screen.getByTestId('pause'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('resume-same'))
    })
    expect(element.src).toBe(srcAfterA)
    expect(element.loadCalls).toBe(loadAfterA)
    expect(screen.getByTestId('status').textContent).toBe('playing')
  })

  it('queue mutations never autoplay', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    const playAfterStart = element.playCalls
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-c'))
    })
    expect(screen.getByTestId('queue').textContent).toBe('a,b,c')
    expect(element.playCalls).toBe(playAfterStart)
    expect(screen.getByTestId('intent').textContent).toBe('no')
  })

  it('clearing the queue pauses and clears the source', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('clear'))
    })
    expect(element.removeAttributeKeys).toContain('src')
    expect(element.pauseCalls).toBeGreaterThan(0)
    expect(screen.getByTestId('current').textContent).toBe('none')
    expect(screen.getByTestId('status').textContent).toBe('idle')
  })

  it('reports a play failure without crashing the app', async () => {
    const { audio } = renderHarness({ rejectPlay: true })
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    await act(async () => {})
    expect(element.playCalls).toBe(1)
    expect(screen.getByTestId('status').textContent).toBe('error')
    expect(screen.getByTestId('intent').textContent).toBe('no')
  })

  it('next advances through the queue', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('next'))
    })
    expect(element.src).toContain('/songs/b/stream')
    expect(screen.getByTestId('current').textContent).toBe('b')
    expect(screen.getByTestId('status').textContent).toBe('playing')
  })

  it('previous before the 3s threshold goes back a song', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('next'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('previous'))
    })
    expect(element.src).toContain('/songs/a/stream')
    expect(screen.getByTestId('current').textContent).toBe('a')
  })

  it('ended event advances to the next song exactly once', async () => {
    const { audio } = renderHarness()
    const element = audio.last()
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-song-a'))
    })
    await act(async () => {
      element.dispatchEvent(new Event('ended'))
    })
    expect(screen.getByTestId('current').textContent).toBe('b')
    expect(element.playCalls).toBe(2)
  })
})
