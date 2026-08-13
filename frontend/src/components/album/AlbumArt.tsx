import { initials } from '../../lib/format'

const gradients = [
  'from-violet-600 to-fuchsia-500',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-rose-500',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-purple-600',
  'from-orange-500 to-pink-500',
]

function hashValue(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

interface AlbumArtProps {
  title: string
  className?: string
  rounded?: string
}

export function AlbumArt({ title, className = 'h-12 w-12', rounded = 'rounded-lg' }: AlbumArtProps) {
  const gradient = gradients[hashValue(title) % gradients.length]
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${gradient} text-white ${rounded} ${className}`}
      aria-hidden="true"
    >
      <span className="text-lg font-semibold drop-shadow-sm">{initials(title)}</span>
    </div>
  )
}
