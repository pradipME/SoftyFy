import { useMemo } from 'react'
import { StaggerItem } from '../components/motion/Stagger'
import { SongList } from '../components/song/SongList'
import { CreditFooter } from '../components/ui/CreditFooter'
import { SONGS } from '../data/songs'

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
        <p className="text-sm text-muted">Your collection, ready offline.</p>
      </StaggerItem>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-lg font-bold tracking-tight">Your library</h2>
        <SongList songs={SONGS} queue={SONGS} />
      </section>

      <StorySection />

      <CreditFooter className="mt-4" />
    </div>
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
      <h2 className="story-title text-2xl font-bold text-[var(--color-accent)] mb-3">
        Why I Built SoftyFy 🎧
      </h2>
      <p className="story-text text-sm text-[var(--color-muted)] leading-relaxed mb-4">
        Mujhe nahate waqt gaane sunne ki aadat hai, aur Spotify me jo ads aate the wo bohot irritate karte the. Ek developer hone ke naate socha — kyu na apna khud ka WebApp banau, jisme sirf meri playlist ho, jo main nahate waqt sunta hun — no ads, nothing else. Development start ki, to ek point aaya jab app ka naam sochna tha. Iske piche bhi ek chhoti si story hai — mere uncle ne ek baar Spotify ko "Softyfy" bol diya tha, aur bas mujhe wahi naam pasand aa gaya. Isliye maine is app ka naam SoftyFy rakh diya.
      </p>
      <p className="story-signature text-xs fontitalic text-[var(--color-fg)] opacity-80 mb-6">
        — Made with &lt;3
      </p>

      <hr className="border-[var(--color-line)] mb-6" />

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
