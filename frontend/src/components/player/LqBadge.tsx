/**
 * Small, subtle pill shown next to a song title that reports which quality
 * tier the current track is playing at. Purely informational — resting on it
 * reveals the human explanation. The parent passes the tier that was picked
 * at load time (`currentQuality`), so the badge shows for both LQ and HQ; the
 * HQ variant is deliberately fainter than the LQ one.
 */
export function LqBadge({ quality }: { quality: 'lq' | 'hq' }) {
  const isLq = quality === 'lq'
  return (
    <span
      title={
        isLq ? "You're on low quality because of weak internet" : "You're on high quality"
      }
      aria-label={
        isLq ? "You're on low quality because of weak internet" : "You're on high quality"
      }
      className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider ${
        isLq
          ? 'border-white/10 bg-white/5 text-muted/90'
          : 'border-transparent bg-transparent text-dim/70'
      }`}
    >
      {isLq ? 'LQ' : 'HQ'}
    </span>
  )
}