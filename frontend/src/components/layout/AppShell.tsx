import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav, Sidebar } from './Sidebar'
import { PlayerBar } from '../player/PlayerBar'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
      <PlayerBar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  )
}
