import { useFavorites } from '../../state/FavoritesContext'
import { useToast } from '../toast/ToastContext'
import { HeartIcon } from '../ui/icons'

interface FavoriteButtonProps {
  songId: string
  songTitle: string
  className?: string
}

export function FavoriteButton({ songId, songTitle, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { toast } = useToast()
  const active = isFavorite(songId)

  const handleClick = async () => {
    try {
      await toggleFavorite(songId)
    } catch {
      toast('Could not update favorites. Please try again.', 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${songTitle} from favorites` : `Add ${songTitle} to favorites`}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      className={`rounded-full p-2 transition-colors hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active ? 'text-accent-strong' : 'text-dim hover:text-accent-strong'
      } ${className}`}
    >
      <HeartIcon className="h-4 w-4" fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}
