export interface NativeNowPlaying {
  title: string
  artist: string
  album: string
  artwork?: string
  duration: number
  position: number
  playing: boolean
}

export interface PlaybackAction {
  action?: string
  position?: number
}

interface NativeMediaSession {
  updateNowPlaying: (opts: NativeNowPlaying) => Promise<void>
  updatePosition: (opts: { position: number; duration: number; playing: boolean }) => Promise<void>
  setPlaybackState: (opts: { playing: boolean }) => Promise<void>
  clearNowPlaying: () => Promise<void>
  addListener: (
    event: string,
    cb: (data: PlaybackAction) => void,
  ) => Promise<{ remove: () => void }>
}

declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        MediaSessionBridge?: NativeMediaSession
      }
    }
  }
}

function bridge(): NativeMediaSession | null {
  try {
    return window.Capacitor?.Plugins?.MediaSessionBridge ?? null
  } catch {
    return null
  }
}

export function hasNativeMediaSession(): boolean {
  return bridge() !== null
}

export async function nativeUpdateNowPlaying(meta: NativeNowPlaying): Promise<void> {
  const b = bridge()
  if (!b) return
  try {
    await b.updateNowPlaying(meta)
  } catch {
    // Bridge not ready yet — web MediaSession covers this gap.
  }
}

export async function nativeUpdatePosition(
  position: number,
  duration: number,
  playing: boolean,
): Promise<void> {
  const b = bridge()
  if (!b) return
  try {
    await b.updatePosition({ position, duration, playing })
  } catch {
    // No-op.
  }
}

export async function nativeSetPlaybackState(playing: boolean): Promise<void> {
  const b = bridge()
  if (!b) return
  try {
    await b.setPlaybackState({ playing })
  } catch {
    // No-op.
  }
}

export async function nativeClearNowPlaying(): Promise<void> {
  const b = bridge()
  if (!b) return
  try {
    await b.clearNowPlaying()
  } catch {
    // No-op.
  }
}

/** Subscribes to native transport events; returns an unsubscribe function. */
export function onNativePlaybackAction(cb: (action: PlaybackAction) => void): () => void {
  const b = bridge()
  if (!b) return () => {}
  const handlePromise = b.addListener('playbackAction', (data) => cb(data ?? {}))
  let disposed = false
  handlePromise.then((handle) => {
    if (disposed) handle.remove()
  })
  return () => {
    disposed = true
    handlePromise.then((handle) => handle.remove())
  }
}