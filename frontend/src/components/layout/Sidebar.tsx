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
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent/15 text-accent-strong'
                : 'text-muted hover:bg-elevated hover:text-fg'
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
    <aside className="hidden w-60 shrink-0 flex-col gap-8 border-r border-line bg-surface p-4 lg:flex">
      <a href="/" className="flex items-center gap-2.5 px-2 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
          <MusicIcon className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">
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
