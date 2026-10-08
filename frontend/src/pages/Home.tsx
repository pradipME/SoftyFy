import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { Cover } from '../components/song/Cover'
import { CreditFooter } from '../components/ui/CreditFooter'
import { SONGS, SONGS_BY_LIBRARY } from '../data/songs'
import { usePlayer } from '../context/PlayerContext'

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const greeting = useMemo(() => greetingFor(new Date()), [])
  const { currentSong, status } = usePlayer()
  const isPlaying = status === 'playing'

  return (
    <div className="flex flex-col gap-10">
      {/* ── Hero greeting ───────────────────────────────────────────── */}
      <StaggerItem className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="gradient-text">{greeting}</span> 
        </h1>
        <p className="text-sm text-muted">
          {SONGS.length} songs across{' '}
          <span className="font-semibold text-fg">{Object.keys(SONGS_BY_LIBRARY).length} albums</span>{' '}
          — no account needed
        </p>
      </StaggerItem>

      {/* ── Currently playing banner (if any) ──────────────────────── */}
      {currentSong && (
        <StaggerItem>
          <NowPlayingBanner song={currentSong} isPlaying={isPlaying} />
        </StaggerItem>
      )}

      {/* ── Albums grid ────────────────────────────────────────────── */}
      <section>
        <StaggerItem>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
            Your Albums
          </h2>
        </StaggerItem>
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(SONGS_BY_LIBRARY).map(([name, songs]) => (
            <StaggerItem key={name}>
              <AlbumCard name={name} songs={songs} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Feedback section ────────────────────────────────────────── */}
      <StaggerSection />

      <CreditFooter className="mt-4" />
    </div>
  )
}

/* ── Currently-playing banner ──────────────────────────────────────────── */
function NowPlayingBanner({
  song,
  isPlaying,
}: {
  song: (typeof SONGS)[number]
  isPlaying: boolean
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <Cover
            src={song.coverSrc}
            alt={song.title}
            className={`h-16 w-16 rounded-xl shadow-lg ${isPlaying ? 'animate-pulse-glow' : ''}`}
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
              <WaveBars />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
            {isPlaying ? '▶ Now Playing' : '⏸ Paused'}
          </p>
          <p className="truncate text-base font-bold text-fg">{song.title}</p>
          <p className="truncate text-sm text-muted">{song.artist}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Wave bars visualizer ──────────────────────────────────────────────── */
function WaveBars() {
  return (
    <span className="flex h-4 items-end gap-px" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="wave-bar h-full w-0.5 rounded-full bg-accent" />
      ))}
    </span>
  )
}

/* ── Album card ────────────────────────────────────────────────────────── */
function AlbumCard({ name, songs }: { name: string; songs: typeof SONGS }) {
  const navigate = useNavigate()
  const firstCover = songs[0]?.coverSrc ?? ''

  return (
    <button
      onClick={() => navigate(`/library?album=${encodeURIComponent(name)}`)}
      className="album-card group flex flex-col gap-3 rounded-xl bg-surface/60 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative overflow-hidden rounded-lg">
        <Cover
          src={firstCover}
          alt={name}
          className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <span className="flex h-10 w-10 scale-0 items-center justify-center rounded-full bg-accent text-black shadow-xl transition-transform duration-200 group-hover:scale-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M8 5v14l11-7Z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{name}</p>
        <p className="truncate text-xs text-muted">{songs.length} songs</p>
      </div>
    </button>
  )
}

/* ── Feedback section ──────────────────────────────────────────────────── */
function StaggerSection() {
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
    <motion.section
      className="story-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
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
        />
        <button type="submit" className="feedback-btn">
          Send Feedback ↗
        </button>
      </form>
    </motion.section>
  )
}
