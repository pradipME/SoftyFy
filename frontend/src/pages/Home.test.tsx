// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PlayerProvider } from '../context/PlayerContext'
import { HomePage } from './Home'

function renderPage() {
  return render(
    <PlayerProvider>
      <HomePage />
    </PlayerProvider>,
  )
}

afterEach(cleanup)

describe('HomePage', () => {
  it('no longer shows the "Recently added" rail', () => {
    renderPage()
    expect(screen.queryByText('Recently added')).toBeNull()
  })

  it('still shows the greeting and Your library list', () => {
    renderPage()
    expect(screen.getByText('Your library')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Recently added' })).toBeNull()
  })

  it('shows the shared credit footer and opens the About sheet', async () => {
    renderPage()
    expect(screen.getByText('♥')).toBeTruthy()
    expect(screen.getByText(/by Pradip Sonawane/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /About Pradip/ }))
    expect(screen.getByRole('dialog', { name: 'About Pradip' })).toBeTruthy()
    expect(screen.getByText('Made by Pradip Sonawane')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
