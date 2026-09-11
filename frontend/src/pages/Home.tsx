import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { Cover } from '../components/song/Cover'
import { CreditFooter } from '../components/ui/CreditFooter'
import { SONGS, SONGS_BY_LIBRARY } from '../data/songs'

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const greeting = useMemo(() => greetingFor(new Date()), [])

  return (
    <div className="flex flex-col gap-8">
      <StaggerItem className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting}</h1>
        <p className="text-sm text-muted">{SONGS.length} songs across {Object.keys(SONGS_BY_LIBRARY).length} albums</p>
      </StaggerItem>

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(SONGS_BY_LIBRARY).map(([name, songs]) => (
          <StaggerItem key={name}>
            <AlbumCard name={name} songs={songs} />
          </StaggerItem>
        ))}
      </Stagger>

      <StorySection />

      <CreditFooter className="mt-4" />
    </div>
  )
}

function AlbumCard({ name, songs }: { name: string; songs: typeof SONGS }) {
  const navigate = useNavigate()
  const firstCover = songs[0]?.coverSrc ?? ''

  return (
    <button
      onClick={() => navigate(`/library?album=${encodeURIComponent(name)}`)}
      className="group flex flex-col gap-3 rounded-xl bg-surface/60 p-3 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Cover
        src={firstCover}
        alt={name}
        className="aspect-square w-full rounded-lg"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{name}</p>
        <p className="truncate text-xs text-muted">{songs.length} songs</p>
      </div>
    </button>
  )
}

function StorySection() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const textarea = document.getElementById('feedbackInput') as HTMLTextAreaElement | null
    const feedback = textarea?.value.trim()
    if (!feedback) return

    const phoneNumber = '918767137519'
    const message = encodeURIComponent(`SoftyFy Feedback:\n\n${feedback}`)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

    window.open(whatsappUrl, '_blank')
    textarea!.value = ''
  }

  return (
    <section className="story-card">
      <h3 className="text-lg font-bold text-[var(--color-fg)] mb-2">Got Feedback? 💬</h3>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Kuch bug mila ya suggestion dena hai? Bata do!
      </p>
      <form className="feedback-form" id="feedbackForm" onSubmit={handleSubmit}>
        <textarea
          id="feedbackInput"
          className="feedback-input"
          placeholder="Apna feedback yahan likho..."
          rows={3}
          required
        ></textarea>
        <button type="submit" className="feedback-btn">
          Send Feedback
        </button>
      </form>
    </section>
  )
}
