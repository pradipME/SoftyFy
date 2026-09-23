// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LqBadge } from './LqBadge'

describe('LqBadge', () => {
  it('labels low quality with a weak-internet explanation', () => {
    render(<LqBadge quality="lq" />)
    const badge = screen.getByText('LQ')
    expect(badge.title).toBe("You're on low quality because of weak internet")
  })

  it('labels high quality with a lighter indicator', () => {
    render(<LqBadge quality="hq" />)
    const badge = screen.getByText('HQ')
    expect(badge.title).toBe("You're on high quality")
  })
})