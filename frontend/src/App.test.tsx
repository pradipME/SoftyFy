// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(() => () => Promise.resolve()),
}))

describe('App shell', () => {
  it('renders the shell with the persistent chrome without crashing', () => {
    const { container } = render(<App />)
    expect(container.querySelector('main')).not.toBeNull()
    expect(container.querySelectorAll('nav').length).toBeGreaterThan(0)
    expect(container.textContent).toContain('Home')
  })
})
