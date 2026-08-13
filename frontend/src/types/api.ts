export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type ErrorCode =
  | 'SONG_NOT_FOUND'
  | 'ARTIST_NOT_FOUND'
  | 'ALBUM_NOT_FOUND'
  | 'PLAYLIST_NOT_FOUND'
  | 'INVALID_REORDER_REQUEST'
  | 'VALIDATION_FAILED'
  | 'INVALID_SORT'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export interface ProblemDetail {
  type?: string
  title?: string
  status: number
  detail?: string
  code?: ErrorCode
  errors?: Record<string, string>
}

export type SongSortOption = 'title' | 'artist' | 'album' | 'created'
