import { useEffect, useState } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { AmbientBackground } from '../ambient/AmbientBackground'
import { CoverBackground } from '../ambient/CoverBackground'
import { RouteTransition } from '../motion/RouteTransition'
import { NowPlayingSheet } from '../player/NowPlayingSheet'
import { PlayerBar } from '../player/PlayerBar'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

/**
 * Wraps the routed pages with the persistent UI: desktop sidebar, mobile
 * bottom nav, the floating mini player, the Now Playing sheet, and the ambient
 * cover-glow background behind everything.
 */
export function AppShell() {
  const { selectionEpoch } = usePlayer()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Selecting any song (via playSong) opens the full Now Playing sheet
  // immediately — without a toast/popup. Auto-advance and next/previous do
  // not bump selectionEpoch, so the sheet only opens on user selection.
  useEffect(() => {
    if (selectionEpoch > 0) setSheetOpen(true)
  }, [selectionEpoch])

  return (
    <div className="relative isolate min-h-dvh bg-base text-fg">
      <AmbientBackground />
      <CoverBackground />
      <Sidebar />
      <main className="relative z-10 pb-48 pt-4 md:ml-64 md:pb-32 md:pt-6">
        <div className="mx-auto w-full max-w-6xl px-4">
          <RouteTransition />
        </div>
      </main>
      <PlayerBar onOpenSheet={() => setSheetOpen(true)} />
      <BottomNav />
      <NowPlayingSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
