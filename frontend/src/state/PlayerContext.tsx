import { createContext, useContext, type ReactNode } from 'react'
import type { SongSummary } from '../types/song'

export type PlayerStatus = 'idle'

export interface PlayerState {
  status: PlayerStatus
  currentTrack: SongSummary | null
}

export interface PlayerApi {
  play: (track: SongSummary) => void
  stop: () => void
}

const PlayerStateContext = createContext<PlayerState | null>(null)
const PlayerApiContext = createContext<PlayerApi | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const state: PlayerState = { status: 'idle', currentTrack: null }
  const api: PlayerApi = {
    play: () => {
      // No-op: audio playback is out of scope for Phase 3.
    },
    stop: () => {
      // No-op: no active playback exists.
    },
  }

  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerApiContext.Provider value={api}>{children}</PlayerApiContext.Provider>
    </PlayerStateContext.Provider>
  )
}

export function usePlayerState(): PlayerState {
  const state = useContext(PlayerStateContext)
  if (state === null) throw new Error('usePlayerState must be used within a PlayerProvider')
  return state
}

export function usePlayerApi(): PlayerApi {
  const api = useContext(PlayerApiContext)
  if (api === null) throw new Error('usePlayerApi must be used within a PlayerProvider')
  return api
}
