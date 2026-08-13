export type RepeatMode = 'off' | 'all' | 'one'

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface QueueItem {
  id: string
  title: string
  artistNames: string[]
  albumId: string | null
  albumTitle: string | null
  durationSeconds: number | null
}

/**
 * One-shot playback intent, tied to a single current-song transition.
 * `startAt` is an explicit starting position in seconds (or null to resume
 * from wherever the audio element currently is). Consumed deterministically
 * by the song-load effect via the CONSUME_PLAY_INTENT action.
 */
export interface PlayIntent {
  startAt: number | null
}

export interface PlayerState {
  queue: QueueItem[]
  playOrder: number[]
  position: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  status: PlaybackStatus
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playIntent: PlayIntent | null
  error: string | null
}
