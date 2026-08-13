import { API_BASE } from '../api/client'

export function streamUrl(songId: string): string {
  return `${API_BASE}/songs/${encodeURIComponent(songId)}/stream`
}
