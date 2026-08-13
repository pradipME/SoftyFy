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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-fg lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex w-full max-w-md items-center gap-3 rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-dim transition-colors hover:border-accent/40 hover:text-muted"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">Search your library…</span>
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.65rem] text-dim sm:block">
          ⌘ K
        </kbd>
      </button>

      <div className="ml-auto">
        <AddMusicButton size="sm" />
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
