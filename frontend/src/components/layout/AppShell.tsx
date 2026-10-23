import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { SONGS } from '../../data/songs'
import { AmbientBackground } from '../ambient/AmbientBackground'
import { CoverBackground } from '../ambient/CoverBackground'
import { RouteTransition } from '../motion/RouteTransition'
import { NowPlayingSheet } from '../player/NowPlayingSheet'
import { PlayerBar } from '../player/PlayerBar'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/search': 'Search',
  '/library': 'Library',
}

/** Shared responsive chrome and persistent playback surfaces. */
export function AppShell() {
  const { selectionEpoch } = usePlayer()
  const [sheetOpen, setSheetOpen] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const album = searchParams.get('album')
  const pageLabel = album ?? ROUTE_LABELS[location.pathname] ?? 'Home'

  useEffect(() => {
    if (selectionEpoch > 0) setSheetOpen(true)
  }, [selectionEpoch])

  useEffect(() => {
    const openPlayer = () => setSheetOpen(true)
    document.addEventListener('softyfy:open-player', openPlayer)
    return () => document.removeEventListener('softyfy:open-player', openPlayer)
  }, [])

  return (
    <div className="sonic-shell relative isolate min-h-dvh bg-base text-fg">
      <AmbientBackground />
      <CoverBackground />
      <Sidebar />
      <main className="sonic-main">
        <div className="sonic-main-inner">
          <header className="sonic-topbar">
            <div className="sonic-breadcrumb"><span>SoftyFy</span><span aria-hidden="true">/</span><strong>{pageLabel}</strong></div>
            <span className="sonic-top-meta">{SONGS.length} tracks · one personal archive</span>
          </header>
          <RouteTransition />
        </div>
      </main>
      <PlayerBar onOpenSheet={() => setSheetOpen(true)} />
      <BottomNav />
      <NowPlayingSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
