// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PlayerProvider } from '../context/PlayerContext'
import { LibraryPage } from './Library'

function renderPage() {
  return render(
    <MemoryRouter>
      <PlayerProvider>
        <LibraryPage />
      </PlayerProvider>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('Library page', () => {
  it('renders the library heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Library/i })).toBeTruthy()
  })

  it('keeps the creator credit on Home only (not shown here)', () => {
    renderPage()
    expect(screen.queryByRole('button', { name: /About Pradip/ })).toBeNull()
    expect(screen.queryByText(/Made with/)).toBeNull()
  })
})