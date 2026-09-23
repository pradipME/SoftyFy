/**
 * One-line note reporting which quality tier the current track is playing at.
 * Rendered as plain visible text (no tooltip or hover required) and staged far
 * quieter than the title/artist so it reads as informational rather than a
 * warning. The LQ wording is a touch brighter than HQ's, but both stay muted.
 */
export function QualityNote({ quality }: { quality: 'lq' | 'hq' }) {
  const isLq = quality === 'lq'
  return (
    <p className={`text-[10px] leading-snug ${isLq ? 'text-muted' : 'text-dim/60'}`}>
      {isLq ? "You're on low quality because of weak internet" : "You're on high quality"}
    </p>
  )
}