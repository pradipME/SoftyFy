// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetNetworkMemory } from '../lib/networkMemory'
import type { Song } from '../types/song'
import { PlayerProvider, usePlayer } from './PlayerContext'

const HQ = 'https://cdn.example.com/a.mp3'
const LQ = 'https://cdn.example.com/a-lq.mp3'
const HQ_ONLY = 'https://cdn.example.com/no-lq.mp3'
const HQ_B = 'https://cdn.example.com/b.mp3'
const LQ_B = 'https://cdn.example.com/b-lq.mp3'
const HQ_C = 'https://cdn.example.com/c.mp3'
const LQ_C = 'https://cdn.example.com/c-lq.mp3'
const PREFS_KEY = 'softyfy:preferences'

const song = (overrides: Partial<Song> = {}): Song => ({
  id: 'A',
  title: 'Song A',
  artist: 'Artist',
  album: 'Album',
  durationSec: 180,
  audioSrc: HQ,
  audioSrcLQ: LQ,
  coverSrc: '/covers/A.jpg',
  library: 'Test',
  ...overrides,
})

const songB = song({ id: 'B', title: 'Song B', audioSrc: HQ_B, audioSrcLQ: LQ_B })

/** The shared <audio> created inside useAudioPlayer (the first Audio instance). */
let playerAudio: HTMLMediaElement | null = null
let restoreAudio: (() => void) | null = null

function Probe({ initial, queue }: { initial: Song; queue?: Song[] }) {
  const { currentSong, status, currentQuality, streamingQuality, playSong, setStreamingQuality } =
    usePlayer()
  return (
    <div>
      <div data-testid="title">{currentSong?.title ?? 'none'}</div>
      <div data-testid="quality">{currentQuality?.quality ?? 'none'}</div>
      <div data-testid="reason">{currentQuality?.reason ?? 'none'}</div>
      <div data-testid="status">{status}</div>
      <div data-testid="setting">{streamingQuality}</div>
      <button onClick={() => playSong(initial, queue ?? [initial])}>play</button>
      <button onClick={() => setStreamingQuality('low')}>force low</button>
      <button onClick={() => setStreamingQuality('auto')}>force auto</button>
    </div>
  )
}

/**
 * Installs the audio mocks: a play() that drives the element through the media
 * lifecycle like a real browser, a fixed 100s duration, and a capture of the
 * player's shared element so tests can read the src the player chose.
 */
function installAudioMocks() {
  const OrigAudio = window.Audio
  const origPlay = OrigAudio.prototype.play
  const origDuration = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'duration')
  const origCurrentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime')
  playerAudio = null

  function CapturingAudio() {
    const el = new OrigAudio()
    if (playerAudio === null) playerAudio = el
    return el
  }
  CapturingAudio.prototype = Object.create(OrigAudio.prototype)
  CapturingAudio.prototype.constructor = CapturingAudio

  OrigAudio.prototype.play = function play() {
    this.dispatchEvent(new Event('loadedmetadata'))
    this.dispatchEvent(new Event('durationchange'))
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  }
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
    configurable: true,
    get: () => 100,
  })
  window.Audio = CapturingAudio as unknown as { new (): HTMLAudioElement }
  return () => {
    window.Audio = OrigAudio
    OrigAudio.prototype.play = origPlay
    if (origDuration) Object.defineProperty(HTMLMediaElement.prototype, 'duration', origDuration)
    if (origCurrentTime) {
      Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', origCurrentTime)
    }
  }
}

/** Stubs the Chromium Network Information API; `undefined` removes it. */
function setConnection(conn: Record<string, unknown> | undefined) {
  if (conn === undefined) {
    delete (navigator as { connection?: unknown }).connection
  } else {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: conn })
  }
}

beforeEach(() => {
  restoreAudio = installAudioMocks()
  setConnection(undefined)
  resetNetworkMemory()
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  restoreAudio?.()
  playerAudio = null
  setConnection(undefined)
  resetNetworkMemory()
  window.localStorage.clear()
})

const play = async () => {
  fireEvent.click(screen.getByText('play'))
  await act(async () => {
    await Promise.resolve()
  })
  expect(screen.getByTestId('status').textContent).toBe('playing')
}

const currentQuality = () => screen.getByTestId('quality').textContent
const currentReason = () => screen.getByTestId('reason').textContent
const currentSetting = () => screen.getByTestId('setting').textContent

/** Writes a persisted preference blob the way the app stores it. */
function persistPreference(preferences: Record<string, unknown>) {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences))
}

describe('connection-aware quality selection at load time', () => {
  it('loads the LQ URL when the connection is slow', async () => {
    setConnection({ effectiveType: '3g', rtt: 300, downlink: 0.7, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(LQ)
    expect(currentQuality()).toBe('lq')
  })

  it('loads the HQ URL on a fast connection', async () => {
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(HQ)
    expect(currentQuality()).toBe('hq')
  })

  it('silently uses HQ when a slow-connection song has no LQ version', async () => {
    setConnection({ effectiveType: '3g', rtt: 300, downlink: 0.7, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song({ audioSrcLQ: undefined, audioSrc: HQ_ONLY })} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(HQ_ONLY)
    expect(currentQuality()).toBe('hq')
  })

  it('loads HQ when the Network Information API is unavailable', async () => {
    render(
      <PlayerProvider>
        <Probe initial={song({ audioSrcLQ: undefined, audioSrc: HQ_ONLY })} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(HQ_ONLY)
    expect(currentQuality()).toBe('hq')
  })
})

describe('the manual "Streaming quality" setting', () => {
  it('defaults to auto', () => {
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    expect(currentSetting()).toBe('auto')
  })

  it('restores a persisted choice and forces LQ even on a fast connection', async () => {
    persistPreference({ volume: 0.8, streamingQuality: 'low' })
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    await play()
    expect(currentSetting()).toBe('low')
    expect(playerAudio?.src).toBe(LQ)
    expect(currentQuality()).toBe('lq')
    expect(currentReason()).toBe('manual:low')
  })

  it('restores a persisted "high" and overrides a slow connection', async () => {
    persistPreference({ streamingQuality: 'high' })
    setConnection({ effectiveType: '3g', rtt: 900, downlink: 0.2, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(HQ)
    expect(currentReason()).toBe('manual:high')
  })

  it('ignores a corrupt persisted value and falls back to auto', () => {
    window.localStorage.setItem(PREFS_KEY, '{"streamingQuality":"ultra"}')
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    expect(currentSetting()).toBe('auto')
  })

  it('never reloads the playing song when the setting changes', async () => {
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song()} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(HQ)

    await act(async () => {
      fireEvent.click(screen.getByText('force low'))
    })
    expect(currentSetting()).toBe('low')
    // The tier of a song is decided once, at load time: the source and the
    // reported quality must both stay exactly as they were.
    expect(playerAudio?.src).toBe(HQ)
    expect(currentQuality()).toBe('hq')
    expect(currentReason()).toBe('fast-connection')

    await act(async () => {
      fireEvent.click(screen.getByText('force auto'))
    })
    expect(currentSetting()).toBe('auto')
  })
})

describe('stall memory drives the tier of the following songs', () => {
  /** One stall: waiting fires, playback resumes, waiting fires again. */
  const stallTwice = async () => {
    await act(async () => {
      const el = playerAudio
      el?.dispatchEvent(new Event('waiting'))
      el?.dispatchEvent(new Event('playing'))
      el?.dispatchEvent(new Event('waiting'))
    })
  }

  it('downgrades the next song after the current one stalled twice', async () => {
    // The exact failure the fix targets: a weak mobile signal that still
    // advertises a healthy "4g", so the first song loads HQ and struggles.
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false })
    render(
      <PlayerProvider>
        <Probe initial={song()} queue={[song(), songB]} />
      </PlayerProvider>,
    )
    await play()
    expect(playerAudio?.src).toBe(HQ)

    await stallTwice()
    await act(async () => {
      playerAudio?.dispatchEvent(new Event('ended'))
    })

    expect(screen.getByTestId('title').textContent).toBe('Song B')
    expect(playerAudio?.src).toBe(LQ_B)
    expect(currentQuality()).toBe('lq')
    expect(currentReason()).toBe('weak-network:stalls:2')
  })

  it('stays on LQ for the songs after the bad one instead of flip-flopping back', async () => {
    setConnection({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false })
    const a = song()
    const b = song({ id: 'B', title: 'Song B', audioSrc: HQ_B, audioSrcLQ: LQ_B })
    const c = song({ id: 'C', title: 'Song C', audioSrc: HQ_C, audioSrcLQ: LQ_C })
    render(
      <PlayerProvider>
        <Probe initial={a} queue={[a, b, c]} />
      </PlayerProvider>,
    )
    await play()
    await stallTwice()

    // The song after the bad one drops to LQ...
    await act(async () => {
      playerAudio?.dispatchEvent(new Event('ended'))
    })
    expect(playerAudio?.src).toBe(LQ_B)

    // ...and one clean song later is still not enough to climb back: without
    // the stall memory the very next song would have been HQ again.
    await act(async () => {
      playerAudio?.dispatchEvent(new Event('ended'))
    })
    expect(screen.getByTestId('title').textContent).toBe('Song C')
    expect(playerAudio?.src).toBe(LQ_C)
    expect(currentReason()).toBe('weak-network:stalls:2')
  })
})
