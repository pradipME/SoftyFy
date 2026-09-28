import { isManualQualityReason } from '../../lib/audioSources'
import type { ActiveQuality } from '../../context/playerReducer'

/**
 * One-line note reporting which quality tier the current track is playing at.
 * Rendered as plain visible text (no tooltip or hover required) and staged far
 * quieter than the title/artist so it reads as informational rather than a
 * warning.
 *
 * The LQ wording distinguishes the two reasons the tier can drop: a weak
 * network (which the app detected and will recover on its own) versus the user
 * pinning it low themselves, so nobody thinks their choice is going to be
 * overridden.
 */
export function QualityNote({ quality }: { quality: ActiveQuality }) {
  const isLq = quality.quality === 'lq'
  const text = isLq
    ? isManualQualityReason(quality.reason)
      ? 'Low quality — set by you'
      : 'Low quality — weak internet'
    : 'High quality'
  return (
    <p className={`text-[10px] leading-snug ${isLq ? 'text-muted' : 'text-dim/60'}`}>
      {text}
    </p>
  )
}
