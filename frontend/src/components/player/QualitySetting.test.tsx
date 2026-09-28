// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StreamingQuality } from '../../context/PlayerContext'
import { QualitySetting } from './QualitySetting'

const setStreamingQuality = vi.fn<(quality: StreamingQuality) => void>()
let current: StreamingQuality = 'auto'

vi.mock('../../context/PlayerContext', () => ({
  usePlayer: () => ({
    streamingQuality: current,
    setStreamingQuality,
  }),
}))

afterEach(() => {
  cleanup()
  setStreamingQuality.mockClear()
  current = 'auto'
})

const options = () => screen.getAllByRole('radio') as HTMLButtonElement[]
const checkedLabel = () => options().find((option) => option.getAttribute('aria-checked') === 'true')?.textContent

describe('QualitySetting', () => {
  it('offers Auto, High and Low, with the current one marked', () => {
    render(<QualitySetting />)
    expect(options().map((option) => option.textContent)).toEqual(['Auto', 'High', 'Low'])
    expect(checkedLabel()).toBe('Auto')
  })

  it('marks the persisted choice rather than defaulting to Auto', () => {
    current = 'low'
    render(<QualitySetting />)
    expect(checkedLabel()).toBe('Low')
  })

  it('reports the picked option to the player', () => {
    render(<QualitySetting />)
    fireEvent.click(screen.getByText('High'))
    expect(setStreamingQuality).toHaveBeenCalledWith('high')
    fireEvent.click(screen.getByText('Low'))
    expect(setStreamingQuality).toHaveBeenCalledWith('low')
    fireEvent.click(screen.getByText('Auto'))
    expect(setStreamingQuality).toHaveBeenCalledWith('auto')
  })

  it('is a labelled radio group so it reads as one choice', () => {
    render(<QualitySetting />)
    const group = screen.getByRole('radiogroup', { name: 'Streaming quality' })
    expect(group).toBeTruthy()
    expect(screen.getByText('Streaming quality')).toBeTruthy()
  })
})
