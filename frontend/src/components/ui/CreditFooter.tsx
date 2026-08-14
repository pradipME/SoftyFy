import { useState } from 'react'
import { AboutSheet } from './AboutSheet'
import { MusicIcon } from './icons'

interface CreditFooterProps {
  className?: string
}

/**
 * Shared creator credit used on Home and Library: a tappable "About SoftyFy"
 * glass pill that opens the About sheet, plus the always-visible signature.
 */
export function CreditFooter({ className = '' }: CreditFooterProps) {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <footer className={`flex flex-col items-center gap-3 text-center ${className}`}>
      <button
        type="button"
        onClick={() => setAboutOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
          <MusicIcon className="h-3 w-3" />
        </span>
        About SoftyFy
      </button>
      <p className="text-xs text-dim">
        Made with <span className="text-accent">♥</span> by Pradip Sonawane
      </p>
      <AboutSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </footer>
  )
}
