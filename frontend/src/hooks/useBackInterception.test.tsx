// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBackInterception } from './useBackInterception'

describe('useBackInterception', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '#/')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('parks exactly one history entry while the overlay is open', () => {
    const onClose = vi.fn()
    const { rerender } = renderHook(({ open }) => useBackInterception(open, onClose), {
      initialProps: { open: false },
    })

    const baseline = window.history.length
    rerender({ open: true })
    expect(window.history.length).toBe(baseline + 1)

    rerender({ open: true })
    expect(window.history.length).toBe(baseline + 1)
  })

  it('dismisses the overlay on a Back press and never double-pushes on reopen', () => {
    const onClose = vi.fn()
    const { rerender } = renderHook(({ open }) => useBackInterception(open, onClose), {
      initialProps: { open: false },
    })

    const baseline = window.history.length
    rerender({ open: true })
    expect(window.history.length).toBe(baseline + 1)

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(onClose).toHaveBeenCalledTimes(1)

    // A second Back press is ignored — the marker was already consumed.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(onClose).toHaveBeenCalledTimes(1)

    // Closing for real (marker already cleared) pops nothing, and reopening
    // parks exactly one fresh marker; repeated opens do not stack.
    rerender({ open: false })
    rerender({ open: true })
    rerender({ open: true })
    expect(window.history.length).toBe(baseline + 2)
  })

  it('pops the parked entry when the overlay is closed through its own UI', () => {
    const onClose = vi.fn()
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { rerender } = renderHook(({ open }) => useBackInterception(open, onClose), {
      initialProps: { open: false },
    })

    rerender({ open: true })
    rerender({ open: false })

    expect(backSpy).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})
