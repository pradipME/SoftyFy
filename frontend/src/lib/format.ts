export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
    return '–'
  }
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AudioQualitySource {
  format: string | null
  bitrateKbps: number | null
  sampleRateHz: number | null
  bitDepth: number | null
}

export function formatAudioQuality(file: AudioQualitySource | null | undefined): string | null {
  if (!file) return null
  const parts: string[] = []
  if (file.bitDepth != null && file.sampleRateHz != null) {
    parts.push(`${file.bitDepth}-bit/${Math.round(file.sampleRateHz / 1000)} kHz`)
  } else if (file.bitrateKbps != null) {
    parts.push(`${file.bitrateKbps} kbps`)
  }
  if (file.format) {
    parts.unshift(file.format.toUpperCase())
  }
  return parts.length > 0 ? parts.join(' · ') : null
}
