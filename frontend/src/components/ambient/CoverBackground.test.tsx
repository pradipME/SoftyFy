// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PlayerProvider, usePlayer } from '../../context/PlayerContext'
import type { Song } from '../../types/song'
import { CoverBackground } from './CoverBackground'

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

/** Lets the jsdom <audio> drive the player state like a real browser. */
function patchAudio() {
  const origPlay = window.Audio.prototype.play
  window.Audio.prototype.play = function play() {
    this.dispatchEvent(new Event('loadedmetadata'))
    this.dispatchEvent(new Event('durationchange'))
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  }
  return () => {
    window.Audio.prototype.play = origPlay
  }
}

function Probe() {
  const api = usePlayer()
  return (
    <div>
      <CoverBackground />
      <button onClick={() => api.playSong(song('A'), [song('A'), song('B')])}>play A</button>
      <button onClick={() => api.playSong(song('B'), [song('A'), song('B')])}>play B</button>
    </div>
  )
}

let restoreAudio: (() => void) | null = null

beforeEach(() => {
  restoreAudio = patchAudio()
})

afterEach(() => {
  cleanup()
  restoreAudio?.()
})

describe('CoverBackground', () => {
  it('renders nothing before any song is active', () => {
    const { container } = render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    expect(container.querySelector('img[src^="/covers/"]')).toBeNull()
  })

  it('renders the active song cover as a blurred, non-interactive backdrop', async () => {
    const { container } = render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    fireEvent.click(screen.getByText('play A'))
    await act(async () => {
      await Promise.resolve()
    })

    const img = container.querySelector('img[src="/covers/A.jpg"]') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.className).toContain('blur')

    const backdrop = img.closest('[aria-hidden="true"]')
    expect(backdrop).not.toBeNull()
    expect(backdrop?.classList.contains('pointer-events-none')).toBe(true)
    expect(backdrop?.classList.contains('fixed')).toBe(true)
  })

  it('crossfades to the new cover when the song changes', async () => {
    const { container } = render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    )
    fireEvent.click(screen.getByText('play A'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.querySelector('img[src="/covers/A.jpg"]')).not.toBeNull()

    fireEvent.click(screen.getByText('play B'))
    await act(async () => {
      await Promise.resolve()
    })

    await waitFor(() => expect(container.querySelector('img[src="/covers/A.jpg"]')).toBeNull(), {
      timeout: 3000,
    })
    expect(container.querySelector('img[src="/covers/B.jpg"]')).not.toBeNull()
  })
})
