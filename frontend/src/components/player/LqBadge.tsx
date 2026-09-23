/**
 * Small, subtle pill shown next to a song title while the track is playing at
 * low-bitrate (LQ) quality. Purely informational — resting on it reveals why
 * the reduced tier was picked. The parent decides when to render it (only when
 * the current song actually loaded its LQ src).
 */
export function LqBadge() {
  return (
    <span
      title="Playing at reduced quality due to a slow connection"
      aria-label="Playing at reduced quality due to a slow connection"
      className="shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-muted/90"
    >
      LQ
    </span>
  )
}