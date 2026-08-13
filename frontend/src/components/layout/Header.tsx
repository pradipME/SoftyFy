import { useState } from 'react'
import { SearchOverlay } from '../../features/search/SearchOverlay'
import { AddMusicButton } from '../../features/upload/AddMusicButton'
import { MenuIcon, SearchIcon } from '../ui/icons'

interface HeaderProps {
  onOpenMobileNav: () => void
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header
      className="flex h-20 shrink-0 items-center gap-4 border-b border-border bg-surface px-6 sm:px-8 border-t border-border/10"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
    >
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-dim hover:bg-surface-elevated hover:text-fg lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="relative flex flex-1 max-w-md">
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-dim hover:bg-surface-elevated hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <AddMusicButton size="sm" />
      </div>
    </header>
  )
}
