import { useMemo } from 'react'
import { StaggerItem } from '../components/motion/Stagger'
import { SongList } from '../components/song/SongList'
import { SongRail } from '../components/song/SongRail'
import { usePlayer } from '../context/PlayerContext'
import { SONGS } from '../data/songs'

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const { playSong } = usePlayer()
  const greeting = useMemo(() => greetingFor(new Date()), [])

  const handlePlay = (song: (typeof SONGS)[number]) => {
    playSong(song, SONGS)
  }

  return (
    <div className="flex flex-col gap-8">
      <StaggerItem className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting}</h1>
        <p className="text-sm text-muted">Your collection, ready offline.</p>
      </StaggerItem>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight">Recently added</h2>
          <span className="text-xs text-muted">{SONGS.length} tracks</span>
        </div>
        <SongRail songs={SONGS} onPlay={handlePlay} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-lg font-bold tracking-tight">Your library</h2>
        <SongList songs={SONGS} queue={SONGS} />
      </section>
    </div>
  )
}
