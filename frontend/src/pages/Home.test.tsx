// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PlayerProvider } from '../context/PlayerContext'
import { HomePage } from './Home'

function renderPage() {
  return render(
    <MemoryRouter>
      <PlayerProvider>
        <HomePage />
      </PlayerProvider>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('HomePage', () => {
  it('shows the greeting and album cards', () => {
    renderPage()
    expect(screen.getByText('Sometimes')).toBeTruthy()
    expect(screen.getByText('Qwali')).toBeTruthy()
  })

  it('no longer shows a flat song list', () => {
    renderPage()
    expect(screen.queryByText('Your library')).toBeNull()
  })

  it('shows the shared credit footer and opens the About sheet', async () => {
    renderPage()
    expect(screen.getByText('♥')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /About Pradip/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /About Pradip/ }))
    expect(screen.getByRole('dialog', { name: 'About Pradip' })).toBeTruthy()
    expect(screen.getByText('Made by Pradip Sonawane')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
