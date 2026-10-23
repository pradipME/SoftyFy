import { useEffect, useState } from 'react'
import { LayoutGroup } from 'framer-motion'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { SONGS } from '../../data/songs'
import { AmbientBackground } from '../ambient/AmbientBackground'
import { CoverBackground } from '../ambient/CoverBackground'
import { RouteTransition } from '../motion/RouteTransition'
import { NowPlayingSheet } from '../player/NowPlayingSheet'
import { PlayerBar } from '../player/PlayerBar'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { HistoryIcon, PeopleIcon, TrendingIcon, UserIcon } from '../ui/icons'
import { AboutSheet } from '../ui/AboutSheet'

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/search': 'Search',
  '/library': 'Library',
}

/** Shared responsive chrome and persistent playback surfaces. */
export function AppShell() {
  const { currentSong } = usePlayer()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [artworkOrigin, setArtworkOrigin] = useState<'desktop' | 'mobile' | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const album = searchParams.get('album')
  const isAlbumDetail = location.pathname === '/library' && Boolean(album)
  const pageLabel = album ?? ROUTE_LABELS[location.pathname] ?? 'Home'

  useEffect(() => {
    const openPlayer = () => {
      setArtworkOrigin(null)
      setSheetOpen(true)
    }
    document.addEventListener('softyfy:open-player', openPlayer)
    return () => document.removeEventListener('softyfy:open-player', openPlayer)
  }, [])

  return (
    <div className={`sonic-shell relative isolate min-h-dvh bg-base text-fg${isAlbumDetail ? ' is-album-detail' : ''}`}>
      <LayoutGroup id="softyfy-player-art">
        <AmbientBackground />
        <CoverBackground />
        <Sidebar />
        <main className="sonic-main">
          <div className="sonic-main-inner">
            <header className="metro-mobile-header md:hidden">
              <h1 className="metro-page-name">{pageLabel}</h1>
              <div className="metro-mobile-actions">
                <Link to="/library" aria-label="History"><HistoryIcon /></Link>
                <Link to="/search" aria-label="Explore"><TrendingIcon /></Link>
                <Link to="/library" aria-label="Collections"><PeopleIcon /></Link>
                <button type="button" onClick={() => setAboutOpen(true)} aria-label="Profile"><UserIcon /></button>
              </div>
            </header>
            <header className="sonic-topbar">
              <div className="sonic-breadcrumb"><span>SoftyFy</span><span aria-hidden="true">/</span><strong>{pageLabel}</strong></div>
              <span className="sonic-top-meta">{SONGS.length} tracks · one personal archive</span>
            </header>
            <RouteTransition />
          </div>
        </main>
        <PlayerBar onOpenSheet={(source) => { setArtworkOrigin(source); setSheetOpen(true) }} />
        <BottomNav onNavigate={() => setSheetOpen(false)} />
        <NowPlayingSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          artworkLayoutId={artworkOrigin === 'mobile'
            ? currentSong ? `mobile-player-art-${currentSong.id}` : undefined
            : artworkOrigin === 'desktop'
              ? currentSong ? `desktop-player-art-${currentSong.id}` : undefined
              : undefined}
        />
        <AboutSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
      </LayoutGroup>
    </div>
  )
}
