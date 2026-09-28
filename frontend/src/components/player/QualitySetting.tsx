import { usePlayer, type StreamingQuality } from '../../context/PlayerContext'

const OPTIONS: readonly { value: StreamingQuality; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Pick high or low based on your connection' },
  { value: 'high', label: 'High', hint: 'Always stream the best quality' },
  { value: 'low', label: 'Low', hint: 'Always stream the small file, saves data' },
]

/**
 * "Streaming quality" control: Auto / High / Low, shown in the Now Playing
 * sheet next to the quality note so the two explain each other. Auto is the
 * default and measures the connection per song (see lib/networkMemory); High
 * and Low pin the tier for every song that has a low-bitrate version.
 *
 * The choice only affects the NEXT song — a track that is already playing is
 * never reloaded, so flipping this mid-song cannot interrupt it.
 */
export function QualitySetting() {
  const { streamingQuality, setStreamingQuality } = usePlayer()
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-dim">Streaming quality</span>
      <div
        role="radiogroup"
        aria-label="Streaming quality"
        className="flex shrink-0 rounded-full border border-line bg-surface p-0.5"
      >
        {OPTIONS.map((option) => {
          const selected = streamingQuality === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              title={option.hint}
              onClick={() => setStreamingQuality(option.value)}
              className={`min-w-[3.25rem] rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                selected ? 'bg-accent text-black' : 'text-muted hover:text-fg'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
