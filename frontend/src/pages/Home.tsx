import { useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Cover } from '../components/song/Cover'
import { PlayIcon } from '../components/ui/icons'
import { SONGS, SONGS_BY_LIBRARY } from '../data/songs'
import { usePlayer } from '../context/PlayerContext'
import { formatPlaybackTime } from '../lib/format'

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.025 } },
}

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: 'easeOut' } },
}

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function HomePage() {
  const navigate = useNavigate()
  const { currentSong, status, playSong } = usePlayer()
  const collections = Object.entries(SONGS_BY_LIBRARY)
  const quickPicks = useMemo(() => {
    if (!currentSong) return SONGS.slice(0, 9)
    const rest = SONGS.filter((song) => song.id !== currentSong.id)
    return [currentSong, ...rest].slice(0, 9)
  }, [currentSong])

  return (
    <motion.div className="sonic-page sonic-page--home metro-home" initial="hidden" animate="show" variants={stagger}>
      <motion.div className="metro-chips" aria-label="Your collections" variants={sectionReveal}>
        <motion.button type="button" className="metro-chip is-selected" onClick={() => navigate('/')} whileTap={{ scale: 0.96 }}>For you</motion.button>
        {collections.slice(0, 5).map(([name]) => (
          <motion.button key={name} type="button" className="metro-chip" onClick={() => navigate(`/library?album=${encodeURIComponent(name)}`)} whileTap={{ scale: 0.96 }}>{name}</motion.button>
        ))}
      </motion.div>

      <motion.section aria-labelledby="albums-title" variants={sectionReveal}>
        <div className="metro-section-heading">
          <div><p className="sonic-eyebrow">Browse your collection</p><h2 id="albums-title">Albums</h2></div>
        </div>
        <motion.div className="metro-albums-grid" variants={stagger} initial="hidden" animate="show">
          {collections.map(([name, songs]) => (
            <motion.button key={name} type="button" className="metro-album-tile" variants={cardReveal} whileTap={{ scale: 0.96 }} onClick={() => navigate(`/library?album=${encodeURIComponent(name)}`)}>
              <Cover src={songs[0]?.coverSrc ?? ''} alt="" className="metro-album-tile-cover" />
              <span className="metro-album-tile-title">{name}<small>{songs.length} songs</small></span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      {currentSong && (
        <motion.section aria-labelledby="keep-listening-title" variants={sectionReveal}>
          <div className="metro-section-heading">
            <div><p className="sonic-eyebrow">Pick up where you left off</p><h2 id="keep-listening-title">Keep listening</h2></div>
          </div>
          <motion.div className="metro-horizontal-list" variants={stagger} initial="hidden" animate="show">
            {collections.map(([name, songs]) => (
              <motion.button key={name} type="button" className="metro-album-card" variants={cardReveal} whileTap={{ scale: 0.96 }} onClick={() => playSong(songs[0], songs)}>
                <span className="metro-album-cover-wrap"><Cover src={songs[0]?.coverSrc ?? ''} alt="" className="metro-album-cover" /><span className="metro-album-play"><PlayIcon /></span></span>
                <strong>{name}</strong><span>{songs.length} songs</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.section>
      )}

      <motion.section aria-labelledby="quick-picks-title" variants={sectionReveal}>
        <div className="metro-section-heading">
          <div><p className="sonic-eyebrow">Picked from your music</p><h2 id="quick-picks-title">Speed dial</h2></div>
          <motion.button type="button" className="metro-more" onClick={() => navigate('/library')} aria-label="See all songs" whileTap={{ scale: 0.88, rotate: 18 }}>•••</motion.button>
        </div>
        <motion.div className="metro-horizontal-list metro-song-shelf" variants={stagger} initial="hidden" animate="show">
          {quickPicks.map((song) => (
            <motion.button key={song.id} type="button" className="metro-song-card" variants={cardReveal} whileTap={{ scale: 0.96 }} onClick={() => playSong(song, SONGS)}>
              <motion.span className="metro-song-card-art" layoutId={`now-playing-art-${song.id}`}><Cover src={song.coverSrc} alt="" className="metro-song-cover" />{currentSong?.id === song.id && status === 'playing' && <i className="metro-song-playing" />}</motion.span>
              <strong>{song.title}</strong><span>{song.artist}{song.durationSec > 0 ? ` · ${formatPlaybackTime(song.durationSec)}` : ''}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>
    </motion.div>
  )
}
