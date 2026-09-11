import { useCallback, useRef } from 'react'

const FFT_SIZE = 256
const SMOOTHING = 0.65
const MIN_DECIBELS = -90
const MAX_DECIBELS = -10

/**
 * Lazily creates a Web Audio graph: MediaElementSource → AnalyserNode → destination.
 *
 * The MediaElementAudioSourceNode can only be created once per HTMLAudioElement
 * lifetime (creating it a second time throws InvalidStateError). Once created it
 * remains alive for the lifetime of the element — even if this hook is unmounted.
 * The AnalyserNode provides live frequency data without affecting playback.
 */
export function useAudioVisualizer(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return null

    // Create the AudioContext lazily (first call only).
    if (contextRef.current === null) {
      try {
        contextRef.current = new AudioContext()
      } catch {
        return null
      }
    }
    const ctx = contextRef.current

    // Create the MediaElementAudioSourceNode once.
    if (sourceRef.current === null) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audio)
      } catch {
        return null
      }
    }
    const source = sourceRef.current

    // Create the AnalyserNode once.
    if (analyserRef.current === null) {
      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = SMOOTHING
      analyser.minDecibels = MIN_DECIBELS
      analyser.maxDecibels = MAX_DECIBELS
      source.connect(analyser).connect(ctx.destination)
      analyserRef.current = analyser
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount)
    }
    return analyserRef.current
  }, [audioRef])

  /**
   * Ensure the graph exists, then resume the AudioContext.
   *
   * Must be called from within a user gesture (song tap) so autoplay policy
   * lets the context run — once a media element is routed through a
   * suspended AudioContext its audio goes silent, so creating AND resuming
   * the graph here (inside the gesture) is what keeps sound flowing.
   * Safe to call repeatedly; resolves when context is running.
   */
  const resume = useCallback(() => {
    ensureGraph()
    const ctx = contextRef.current
    if (ctx === null || ctx.state === 'running') return
    ctx.resume().catch(() => {})
  }, [ensureGraph])

  /**
   * Returns the current frequency bin data (Uint8Array of FFT_SIZE/2 values 0–255),
   * or null if the graph hasn't been created yet.
   */
  const getData = useCallback((): Uint8Array | null => {
    const analyser = ensureGraph()
    const data = frequencyDataRef.current
    if (analyser === null || data === null) return null
    analyser.getByteFrequencyData(data)
    return data
  }, [ensureGraph])

  return { getData, resume, ensureGraph }
}
