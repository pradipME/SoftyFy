// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import { PlayerProvider, usePlayer } from './PlayerContext'

const HQ = 'https://cdn.example.com/a.mp3'
const LQ = 'https://cdn.example.com/a-lq.mp3'
const HQ_ONLY = 'https://cdn.example.com/no-lq.mp3'

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

/** The shared <audio> created inside useAudioPlayer (the first Audio instance). */
let playerAudio: HTMLMediaElement | null = null
let restoreAudio: (() => void) | null = null

function Probe({ initial }: { initial: Song }) {
  const { currentSong, status, currentQuality, playSong } = usePlayer()
  return (
    <div>
      <div data-testid="title">{currentSong?.title ?? 'none'}</div>
      <div data-testid="quality">{currentQuality?.quality ?? 'none'}</div>
      <div data-testid="status">{status}</div>
      <button onClick={() => playSong(initial, [initial])}>play</button>
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
})

afterEach(() => {
  cleanup()
  restoreAudio?.()
  playerAudio = null
  setConnection(undefined)
})

const play = async () => {
  fireEvent.click(screen.getByText('play'))
  await act(async () => {
    await Promise.resolve()
  })
  expect(screen.getByTestId('status').textContent).toBe('playing')
}

const currentQuality = () => screen.getByTestId('quality').textContent

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
