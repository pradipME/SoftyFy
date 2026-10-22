import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { Cover } from '../components/song/Cover'
import { CreditFooter } from '../components/ui/CreditFooter'
import { PlayIcon } from '../components/ui/icons'
import { SONGS, SONGS_BY_LIBRARY } from '../data/songs'
import { usePlayer } from '../context/PlayerContext'

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 5) return 'After hours'
  if (hour < 12) return 'A new day'
  if (hour < 18) return 'Midday listening'
  return 'Evening mode'
}

export function HomePage() {
  const greeting = useMemo(() => greetingFor(new Date()), [])
  const navigate = useNavigate()
  const { currentSong, status, playSong } = usePlayer()
  const collections = Object.entries(SONGS_BY_LIBRARY)
  const currentCollection = currentSong?.library && SONGS_BY_LIBRARY[currentSong.library]
    ? currentSong.library
    : collections[0]?.[0]
  const featuredSongs = currentCollection ? SONGS_BY_LIBRARY[currentCollection] ?? [] : []
  const featuredSong = currentSong && currentSong.library === currentCollection ? currentSong : featuredSongs[0]
  const isPlaying = status === 'playing'

  const playCollection = (name: string, songs: typeof SONGS) => {
    const selected = currentSong && currentSong.library === name ? currentSong : songs[0]
    if (selected) playSong(selected, songs)
  }

  return (
    <div className="sonic-page sonic-page--home">
      <section
        className="sonic-feature"
        style={{ '--feature-accent': colorForCollection(featuredSong?.id ?? currentCollection ?? 'sonic') } as CSSProperties}
        aria-labelledby="home-title"
      >
        <div className="sonic-feature-copy">
          <p className="sonic-eyebrow">{greeting} · your private archive</p>
          <h1 className="sonic-display" id="home-title">Your soundtrack,<br /><em>in living color.</em></h1>
          <p className="sonic-feature-sub">
            {featuredSong
              ? `A collection called ${currentCollection} is ready in your listening room. ${featuredSongs.length} tracks, one continuous mood.`
              : 'Your personal music archive, gathered into one quiet place.'}
          </p>
          <div className="sonic-feature-actions">
            {featuredSongs.length > 0 && (
              <button type="button" className="sonic-action-primary" onClick={() => playCollection(currentCollection!, featuredSongs)}>
                <PlayIcon /> Play collection
              </button>
            )}
            {currentCollection && (
              <button type="button" className="sonic-action-quiet" onClick={() => navigate(`/library?album=${encodeURIComponent(currentCollection)}`)}>
                Explore collection <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </div>
        <div className="sonic-feature-art" aria-hidden="true">
          <div className="sonic-art-orbit" />
          {featuredSong && <Cover key={featuredSong.id} src={featuredSong.coverSrc} alt="" className="sonic-feature-cover" />}
          <span className="sonic-art-index">COLLECTION 01 / {String(collections.length).padStart(2, '0')}</span>
        </div>
      </section>

      {currentSong && (
        <section aria-label="Current listening">
          <div className="sonic-section-head">
            <div>
              <p className="sonic-eyebrow">The room is alive</p>
              <h2>On your frequency</h2>
            </div>
            <span className="sonic-current-tag">{isPlaying ? 'Now playing' : 'Last selected'}</span>
          </div>
          <button type="button" className="sonic-current-strip w-full bg-transparent text-left" onClick={() => document.dispatchEvent(new CustomEvent('softyfy:open-player'))}>
            <Cover key={currentSong.id} src={currentSong.coverSrc} alt={currentSong.title} />
            <span className="sonic-current-copy">
              <strong>{currentSong.title}</strong>
              <span>{currentSong.artist} · {currentSong.library}</span>
            </span>
            <span className="sonic-eyebrow">{isPlaying ? 'Listening' : 'Continue'} ↗</span>
          </button>
        </section>
      )}

      <section aria-labelledby="soundtrack-title">
        <div className="sonic-section-head">
          <div>
            <p className="sonic-eyebrow">A personal listening archive</p>
            <h2 id="soundtrack-title">Your soundtrack</h2>
            <p>{SONGS.length} songs across {collections.length} collections</p>
          </div>
          <button type="button" className="sonic-text-link" onClick={() => navigate('/library')}>All tracks ↗</button>
        </div>
        <Stagger className="sonic-collection-grid">
          {collections.map(([name, songs], index) => (
            <StaggerItem key={name}>
              <CollectionCard
                name={name}
                songs={songs}
                index={index}
                onOpen={() => navigate(`/library?album=${encodeURIComponent(name)}`)}
                onPlay={() => playCollection(name, songs)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <CreditFooter className="mt-1" />
    </div>
  )
}

function CollectionCard({
  name,
  songs,
  index,
  onOpen,
  onPlay,
}: {
  name: string
  songs: typeof SONGS
  index: number
  onOpen: () => void
  onPlay: () => void
}) {
  const cover = songs[0]?.coverSrc ?? ''
  return (
    <article className="sonic-collection-card">
      <div className="sonic-card-visual">
        <button type="button" onClick={onOpen} aria-label={`Open ${name} collection`} className="sonic-card-art-wrap w-full border-0 p-0 text-left">
          <Cover src={cover} alt={name} className="sonic-card-art" />
          <span className="absolute left-3 top-3 z-10 text-[9px] tracking-[.16em] text-white/75">{String(index + 1).padStart(2, '0')}</span>
        </button>
        <button type="button" className="sonic-card-play" onClick={onPlay} aria-label={`Play ${name}`}>
          <PlayIcon className="h-4 w-4" />
        </button>
      </div>
      <button type="button" onClick={onOpen} className="block w-full border-0 bg-transparent p-0 text-left">
        <span className="sonic-card-title">{name}</span>
        <span className="sonic-card-meta">{songs.length} tracks · collection</span>
      </button>
    </article>
  )
}

function colorForCollection(seed: string): string {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  const hue = hash % 360
  return `hsl(${hue} 24% 42%)`
}
