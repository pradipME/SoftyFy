import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'
import type { PlaybackStatus } from '../../context/playerReducer'

const BAR_COUNT = 48
const BAR_GAP = 3
const IDLE_HEIGHT = 4
const MAX_HEIGHT_RATIO = 0.9
const FALL_SPEED = 1.6
const CLIMB_SPEED = 10
const COLOR = '29, 185, 84' // --color-accent in RGB

interface VisualizerBarsProps {
  getData: () => Uint8Array | null
  status: PlaybackStatus
  className?: string
}

/**
 * Canvas-based frequency visualiser that renders bars reacting to live audio data.
 * Draws quietly when paused (bars decay to minimum) and renders static idle bars
 * when motion is reduced.
 */
export function VisualizerBars({ getData, status, className }: VisualizerBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const prevDataRef = useRef<number[]>(Array(BAR_COUNT).fill(0))
  const targetDataRef = useRef<number[]>(Array(BAR_COUNT).fill(0))
  const rafRef = useRef<number | null>(null)
  const reduced = useReducedMotion()
  const activeRef = useRef(false)
  activeRef.current = status === 'playing'

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const isPlaying = activeRef.current
    const data = getData()

    // Map frequency data to bar heights.
    if (data !== null) {
      const binCount = data.length
      const binsPerBar = Math.max(1, Math.floor(binCount / BAR_COUNT))
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0
        for (let j = 0; j < binsPerBar; j++) {
          sum += data[i * binsPerBar + j]
        }
        const avg = sum / binsPerBar / 255
        // Boost mid-range values slightly so bars look alive even at moderate volume.
        const boosted = Math.pow(avg, 0.8)
        targetDataRef.current[i] = isPlaying ? boosted : 0
      }
    }

    // Smoothly interpolate from previous to target heights.
    const prev = prevDataRef.current
    const target = targetDataRef.current
    for (let i = 0; i < BAR_COUNT; i++) {
      const t = target[i]
      const p = prev[i]
      if (t > p) {
        prev[i] = Math.min(t, p + (CLIMB_SPEED / 255) * (1 - i * 0.005))
      } else {
        prev[i] = Math.max(t, p - (FALL_SPEED / 255))
      }
    }

    // Draw bars.
    const barW = Math.max(2, (w - (BAR_COUNT - 1) * BAR_GAP * dpr) / BAR_COUNT)
    const gap = BAR_GAP * dpr
    const maxH = h * MAX_HEIGHT_RATIO
    const minH = IDLE_HEIGHT * dpr
    const cornerRadius = barW * 0.35

    for (let i = 0; i < BAR_COUNT; i++) {
      const value = prev[i]
      const barH = Math.max(minH, value * maxH)
      const x = i * (barW + gap)
      const y = h - barH

      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, cornerRadius)
      ctx.fillStyle = `rgba(${COLOR}, ${0.3 + value * 0.7})`
      ctx.fill()
    }

    if (activeRef.current || prev.some((v) => v > 0.005)) {
      rafRef.current = requestAnimationFrame(draw)
    }
  }, [getData])

  useEffect(() => {
    // Always start the render loop — it will draw idle/falling bars when paused
    // and stop itself once fully settled.
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  if (reduced) {
    // Render a static idle canvas — no animation loop.
    return (
      <canvas
        ref={(c) => {
          canvasRef.current = c
          if (c === null) return
          const dpr = window.devicePixelRatio || 1
          const rect = c.getBoundingClientRect()
          c.width = rect.width * dpr
          c.height = rect.height * dpr
          const ctx = c.getContext('2d')
          if (ctx === null) return
          const w = c.width
          const h = c.height
          const barW = Math.max(2, (w - (BAR_COUNT - 1) * BAR_GAP * dpr) / BAR_COUNT)
          const gap = BAR_GAP * dpr
          const cornerRadius = barW * 0.35
          for (let i = 0; i < BAR_COUNT; i++) {
            const barH = IDLE_HEIGHT * dpr
            const x = i * (barW + gap)
            const y = h - barH
            ctx.beginPath()
            ctx.roundRect(x, y, barW, barH, cornerRadius)
            ctx.fillStyle = `rgba(${COLOR}, 0.3)`
            ctx.fill()
          }
        }}
        className={className}
        aria-hidden="true"
      />
    )
  }

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
