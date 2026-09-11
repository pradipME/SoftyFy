import { useCallback, useEffect, useRef } from 'react'
import type { PlaybackStatus } from '../context/playerReducer'

const FFT_SIZE = 1024
const BAND_START = 2
const BAND_END = 16
const ONSET_THRESHOLD = 1.4
const MIN_ENERGY = 12
const BEAT_INTERVAL_MS = 260
const VIBRATE_MS = 12
const AVERAGE_SMOOTHING = 0.95

type AudioContextCtor = typeof AudioContext
type CapturableAudio = HTMLAudioElement & { captureStream?: () => MediaStream }

function getAudioContext(): AudioContextCtor | null {
  if (typeof AudioContext !== 'undefined') return AudioContext
  const w = window as unknown as { webkitAudioContext?: AudioContextCtor }
  if (typeof w.webkitAudioContext === 'function') return w.webkitAudioContext
  return null
}

function isSupported(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  if (typeof HTMLMediaElement === 'undefined') return false
  const proto = HTMLMediaElement.prototype as unknown as { captureStream?: () => MediaStream }
  if (typeof proto.captureStream !== 'function') return false
  return getAudioContext() !== null
}

/**
 * Vibrates the phone with a short tap on each musical beat while a song is
 * playing — the "iPhone Music Haptics" feel. Android-Chrome only (the Web
 * Vibration API is not implemented on iOS Safari, and `captureStream` is what
 * lets us watch the audio without touching the `<audio>` element's output).
 *
 * The element keeps playing straight to the speakers. `audio.captureStream()`
 * taps a copy of its output into a MediaStreamAudioSource → AnalyserNode, and
 * a requestAnimationFrame loop does energy-based onset detection in the bass
 * band. On each beat it fires `navigator.vibrate()`. The graph never connects
 * to the AudioContext destination, so sound can never be silenced or altered.
 */
export function useBeatHaptics(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  status: PlaybackStatus,
  enabled: boolean,
) {
  const supported = useRef(isSupported()).current
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastBeatRef = useRef(0)
  const energyAvgRef = useRef(0)

  const activeRef = useRef(false)
  activeRef.current = status === 'playing' && enabled

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current as CapturableAudio | null
    if (audio === null || contextRef.current !== null) return

    try {
      const Ctx = getAudioContext()
      if (Ctx === null || typeof audio.captureStream !== 'function') return
      const stream = audio.captureStream()
      if (stream.getAudioTracks().length === 0) return
      const ctx = new Ctx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      contextRef.current = ctx
      analyserRef.current = analyser
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount)
    } catch {
      // Unsupported or capture failed — haptics stay off, playback is unaffected.
    }
  }, [audioRef])

  /**
   * Builds the graph and makes sure the AudioContext runs. Called from inside
   * user gestures (play/track changes) to satisfy autoplay policies.
   */
  const resume = useCallback(() => {
    ensureGraph()
    const ctx = contextRef.current
    if (ctx === null || ctx.state === 'running') return
    ctx.resume().catch(() => {})
  }, [ensureGraph])

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick)
    if (!activeRef.current || document.hidden) return
    const analyser = analyserRef.current
    const data = frequencyDataRef.current
    if (analyser === null || data === null) return
    analyser.getByteFrequencyData(data)

    let energy = 0
    for (let i = BAND_START; i <= Math.min(BAND_END, data.length - 1); i += 1) {
      energy += data[i]
    }

    const now = performance.now()
    const average = energyAvgRef.current
    if (energy > average * ONSET_THRESHOLD && energy > MIN_ENERGY && now - lastBeatRef.current > BEAT_INTERVAL_MS) {
      lastBeatRef.current = now
      energyAvgRef.current = energy
      navigator.vibrate(VIBRATE_MS)
    } else {
      energyAvgRef.current = average * AVERAGE_SMOOTHING + energy * (1 - AVERAGE_SMOOTHING)
    }
  }, [])

  useEffect(() => {
    if (!activeRef.current) return
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [tick, status, enabled])

  return { isSupported: supported, resume }
}