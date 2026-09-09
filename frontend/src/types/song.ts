/**
 * A single playable song.
 *
 * All audio and cover files live in `public/` and are referenced by their
 * absolute path (e.g. `/audio/track-01.mp3`), so they work on any static host.
 */
export interface Song {
  /** Unique id used as the React key and by the player. Keep it stable. */
  id: string
  /** Display title shown everywhere in the UI. */
  title: string
  /** Artist name shown next to the title. */
  artist: string
  /** Optional album name (used in Search). */
  album?: string
  /** Rough duration in seconds. Used only until the real duration is read from the audio file. */
  durationSec: number
  /**
   * Absolute path to the audio file, e.g. "/audio/track-01.mp3" — or a full
   * external URL for songs hosted outside this repo (e.g. "https://cdn/.../a.mp3").
   */
  audioSrc: string
  /**
   * Absolute path to the cover image, e.g. "/covers/track-01.jpg" — or a full
   * external URL (e.g. "https://cdn/.../a.jpg"). External covers that block
   * CORS fall back to a generated palette/placeholder, never breaking the UI.
   */
  coverSrc: string
  /** Album/collection name shown as a card on the Home page (e.g. "Bathroom", "Qwali"). */
  library: string
}
