import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Button } from './Button'
import { CloseIcon, ExternalLinkIcon, MusicIcon } from './icons'

interface AboutSheetProps {
  open: boolean
  onClose: () => void
}

const PORTFOLIO_URL = 'https://pradip-portfolio-7xhn.onrender.com'

/**
 * Lightweight centered glass card with the app's credit line. No drag — tap
 * the backdrop, the close button, "Got it", or press Escape to dismiss.
 * Framer-Motion's MotionConfig reducedMotion="user" downgrades the spring.
 */
export function AboutSheet({ open, onClose }: AboutSheetProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="about"
          role="dialog"
          aria-modal="true"
          aria-label="About SoftyFy"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div aria-hidden className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10]/80 shadow-2xl shadow-black/60 backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
                <MusicIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-fg">SoftyFy</h2>
                <p className="mt-1 text-sm font-medium text-fg">Made by Pradip Sonawane</p>
                <p className="mt-1 text-sm text-muted">A personal music player, built from scratch.</p>
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent/30 hover:bg-white/10 hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  View my work
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
              <Button variant="secondary" size="sm" className="mt-2" onClick={onClose}>
                Got it
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
