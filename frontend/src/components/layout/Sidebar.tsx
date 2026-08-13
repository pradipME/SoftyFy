import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  DiscIcon,
  HeartIcon,
  HomeIcon,
  ListMusicIcon,
  MusicIcon,
  UsersIcon,
} from '../ui/icons'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <HomeIcon className="h-5 w-5" /> },
  { to: '/songs', label: 'Songs', icon: <MusicIcon className="h-5 w-5" /> },
  { to: '/artists', label: 'Artists', icon: <UsersIcon className="h-5 w-5" /> },
  { to: '/albums', label: 'Albums', icon: <DiscIcon className="h-5 w-5" /> },
  { to: '/playlists', label: 'Playlists', icon: <ListMusicIcon className="h-5 w-5" /> },
  { to: '/favorites', label: 'Favorites', icon: <HeartIcon className="h-5 w-5" /> },
]

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'bg-accent/10 text-accent-strong'
                : 'text-muted hover:bg-surface-elevated hover:text-accent-strong'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex-col border-r border-border lg:flex bg-surface p-6 lg:p-8 shadow-xl z-40">
      <a
        href="/"
        className="flex items-center gap-3 mb-8"
        style={{ color: 'var(--fg)' }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-strong">
          <MusicIcon className="h-5 w-5" />
        </span>
        <span className="text-xl font-semibold tracking-tight">
          Softy<span className="text-accent-strong">Fy</span>
        </span>
      </a>
      <Nav />
    </aside>
  )
}

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-y-0 left-0 flex w-64 flex-col gap-8 bg-surface p-4 shadow-2xl">
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
              <MusicIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Softy<span className="text-accent-strong">Fy</span>
            </span>
          </span>
        </div>
        <Nav onNavigate={onClose} />
      </div>
    </div>
  )
}
