import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav, Sidebar } from './Sidebar'
import { PlayerBar } from '../player/PlayerBar'
import { QueueDrawer } from '../player/QueueDrawer'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const { pathname } = useLocation()
  const showPlayerBar = pathname !== '/now-playing'

  return (
    <div className="flex h-dvh flex-col bg-base text-fg">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      {showPlayerBar ? <PlayerBar onOpenQueue={() => setQueueOpen(true)} /> : null}
      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  )
}
