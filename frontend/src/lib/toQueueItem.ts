import type { QueueItem } from '../player/types'
import type { Song, SongSummary } from '../types/song'

export function songToQueueItem(song: Song): QueueItem {
  return {
    id: song.id,
    title: song.title,
    artistNames: song.artists.map((artist) => artist.name),
    albumId: song.album?.id ?? null,
    albumTitle: song.album?.title ?? null,
    durationSeconds: song.durationSeconds,
  }
}

export function songSummaryToQueueItem(song: SongSummary): QueueItem {
  return {
    id: song.id,
    title: song.title,
    artistNames: song.artistNames,
    albumId: song.albumId,
    albumTitle: song.albumTitle,
    durationSeconds: song.durationSeconds,
  }
}
