// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PlayerProvider } from '../context/PlayerContext'
import { LibraryPage } from './Library'

function renderPage() {
  return render(
    <PlayerProvider>
      <LibraryPage />
    </PlayerProvider>,
  )
}

afterEach(cleanup)

describe('Library footer credit', () => {
  it('renders the persistent signature and the About entry point', () => {
    renderPage()
    expect(screen.getByText(/Made with/)).toBeTruthy()
    expect(screen.getByText('♥')).toBeTruthy()
    expect(screen.getByText(/by Pradip Sonawane/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /About Pradip/ })).toBeTruthy()
  })

  it('opens and closes the About sheet', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /About Pradip/ }))

    expect(screen.getByRole('dialog', { name: 'About Pradip' })).toBeTruthy()
    expect(screen.getByText('Made by Pradip Sonawane')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'About Pradip' })).toBeTruthy()
    expect(screen.getByText('SoftyFy, a personal music player built from scratch.')).toBeTruthy()

    const link = screen.getByRole('link', { name: /View my work/ }) as HTMLAnchorElement
    expect(link.href).toBe('https://pradip-portfolio-7xhn.onrender.com/')
    expect(link.target).toBe('_blank')

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('dismisses the About sheet with the Escape key', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /About Pradip/ }))
    expect(screen.getByRole('dialog', { name: 'About Pradip' })).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
