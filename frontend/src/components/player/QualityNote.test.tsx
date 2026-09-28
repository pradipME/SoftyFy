// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { QualityNote } from './QualityNote'

afterEach(cleanup)

describe('QualityNote', () => {
  it('explains an automatic LQ drop as a weak internet', () => {
    render(<QualityNote quality={{ quality: 'lq', reason: 'weak-network:stalls:2' }} />)
    expect(screen.getByText('Low quality — weak internet')).toBeTruthy()
  })

  it('blames the user only when they pinned the tier themselves', () => {
    render(<QualityNote quality={{ quality: 'lq', reason: 'manual:low' }} />)
    expect(screen.getByText('Low quality — set by you')).toBeTruthy()
  })

  it('shows the high-quality note for HQ', () => {
    render(<QualityNote quality={{ quality: 'hq', reason: 'measured-fast:600ms' }} />)
    expect(screen.getByText('High quality')).toBeTruthy()
  })

  it('says nothing about the network when HQ was forced by the setting', () => {
    render(<QualityNote quality={{ quality: 'hq', reason: 'manual:high' }} />)
    expect(screen.getByText('High quality')).toBeTruthy()
    expect(screen.queryByText(/weak internet/)).toBeNull()
  })
})
