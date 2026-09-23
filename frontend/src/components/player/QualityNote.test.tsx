// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QualityNote } from './QualityNote'

describe('QualityNote', () => {
  it('shows the weak-internet explanation for LQ directly as text', () => {
    render(<QualityNote quality="lq" />)
    expect(screen.getByText("You're on low quality because of weak internet")).toBeTruthy()
  })

  it('shows the high-quality note for HQ directly as text', () => {
    render(<QualityNote quality="hq" />)
    expect(screen.getByText("You're on high quality")).toBeTruthy()
  })
})