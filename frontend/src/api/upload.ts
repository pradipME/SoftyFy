import { ApiError, API_BASE } from './client'
import type { ProblemDetail } from '../types/api'
import type { Song } from '../types/song'

export interface UploadResult {
  song: Song
  created: boolean
}

export interface UploadProgress {
  loaded: number
  total: number | null
}

export interface UploadOverrides {
  title?: string
  artist?: string
  album?: string
}

const MAX_UPLOAD_SIZE_MB = 200

export const ACCEPTED_AUDIO_EXTENSIONS = ['mp3', 'flac', 'wav', 'm4a', 'ogg'] as const

export function isSupportedAudioFile(file: File): boolean {
  const dot = file.name.lastIndexOf('.')
  if (dot < 0) return false
  const extension = file.name.slice(dot + 1).toLowerCase()
  return (ACCEPTED_AUDIO_EXTENSIONS as readonly string[]).includes(extension)
}

export function isWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_UPLOAD_SIZE_MB * 1024 * 1024
}

export function uploadAudioFile(
  file: File,
  overrides: UploadOverrides,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)
    if (overrides.title) formData.append('title', overrides.title)
    if (overrides.artist) formData.append('artist', overrides.artist)
    if (overrides.album) formData.append('album', overrides.album)

    xhr.open('POST', `${API_BASE}/songs/upload`)
    xhr.responseType = 'json'

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.({ loaded: event.loaded, total: event.total })
      } else {
        onProgress?.({ loaded: 0, total: null })
      }
    })

    xhr.addEventListener('load', () => {
      const payload = xhr.response as UploadResult | ProblemDetail | null
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as UploadResult)
        return
      }
      reject(new ApiError(payload as ProblemDetail))
    })

    xhr.addEventListener('error', () => {
      reject(
        new ApiError(
          { status: 0, title: 'Network error', detail: 'Could not reach the server.' },
          true,
        ),
      )
    })

    xhr.addEventListener('abort', () => {
      reject(new DOMException('The request was aborted.', 'AbortError'))
    })

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener('abort', () => xhr.abort())
    }

    xhr.send(formData)
  })
}
