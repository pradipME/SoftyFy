// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
  library: 'Test',
})

/** The shared <audio> created inside useAudioPlayer (the first Audio instance). */
let playerAudio: HTMLMediaElement | null = null
let restoreAudio: (() => void) | null = null

function Probe() {
  const { currentSong, status, playSong } = usePlayer()
  return (
    <div>
      <div data-testid="title">{currentSong?.title ?? 'none'}</div>
      <div data-testid="status">{status}</div>
      <button onClick={() => playSong(song('A'), [song('A'), song('B')])}>play</button>
    </div>
  )
}

/** Simulates the OS / tab being foregrounded: no hidden flag, dispatch event. */
function goVisible() {
  delete (document as { hidden?: boolean }).hidden
  document.dispatchEvent(new Event('visibilitychange'))
}

function setHidden() {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
}

/**
 * Installs the audio mocks: a play() that drives the element through the media
 * lifecycle like a real browser, a fixed 100s duration, and a capture of the
 * player's shared element so tests can fire media events on it.
 */
function installAudioMocks() {
  const OrigAudio = window.Audio
  const origPlay = OrigAudio.prototype.play
  const origDuration = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'duration')
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
    delete (document as { hidden?: boolean }).hidden
  }
}

beforeEach(() => {
  restoreAudio = installAudioMocks()
})

afterEach(() => {
  cleanup()
  restoreAudio?.()
  playerAudio = null
})

const playSong = async () => {
  fireEvent.click(screen.getByText('play'))
  await act(async () => {
    await Promise.resolve()
  })
  expect(screen.getByTestId('title').textContent).toBe('Song A')
  expect(screen.getByTestId('status').textContent).toBe('playing')
}

describe('auto-advance with the screen off / page hidden', () => {
  it('advances to the next song when a track ends while the screen is off', async () => {
    setHidden()
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    await playSong()

    // The track finishes in the background and the browser still delivers the
    // native events (typical Android / desktop behaviour while playing audio).
    await act(async () => {
      playerAudio?.dispatchEvent(new Event('ended'))
    })

    expect(screen.getByTestId('title').textContent).toBe('Song B')
    expect(screen.getByTestId('status').textContent).toBe('playing')
  })

  it('auto-advances a song that ended while hidden once the user returns', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    await playSong()

    // While hidden the browser suspended JS entirely: the element sat parked at
    // the end, no `ended` event was ever delivered.
    setHidden()
    const audio = playerAudio as HTMLMediaElement
    Object.defineProperty(audio, 'readyState', { configurable: true, get: () => 4 })
    Object.defineProperty(audio, 'ended', { configurable: true, get: () => true })

    // Screen unlocks / tab comes back to foreground.
    await act(async () => {
      goVisible()
    })

    expect(screen.getByTestId('title').textContent).toBe('Song B')
    expect(screen.getByTestId('status').textContent).toBe('playing')
  })

  it('auto-advances a track parked inside its final seconds with no ended event', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    await playSong()

    // Hidden mid-tail: the last chunk drained and playback stopped a hair
    // before the end - paused, not ended, no `ended` fired.
    setHidden()
    const audio = playerAudio as HTMLMediaElement
    Object.defineProperty(audio, 'readyState', { configurable: true, get: () => 4 })
    Object.defineProperty(audio, 'ended', { configurable: true, get: () => false })
    Object.defineProperty(audio, 'currentTime', { configurable: true, get: () => 99 })

    await act(async () => {
      goVisible()
    })

    expect(screen.getByTestId('title').textContent).toBe('Song B')
    expect(screen.getByTestId('status').textContent).toBe('playing')
  })

  it('leaves a paused track alone when it is nowhere near the end', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    await playSong()

    // Song A is paused mid-way while hidden - it should resume, not advance.
    setHidden()
    const audio = playerAudio as HTMLMediaElement
    Object.defineProperty(audio, 'readyState', { configurable: true, get: () => 4 })
    Object.defineProperty(audio, 'ended', { configurable: true, get: () => false })
    Object.defineProperty(audio, 'currentTime', { configurable: true, get: () => 40 })
    Object.defineProperty(audio, 'paused', { configurable: true, get: () => true })

    await act(async () => {
      goVisible()
    })

    expect(screen.getByTestId('title').textContent).toBe('Song A')
    expect(screen.getByTestId('status').textContent).toBe('playing')
  })
})