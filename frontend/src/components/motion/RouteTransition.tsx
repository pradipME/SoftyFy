import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Subtle page transition: the routed screen fades and glides in place rather
 * than popping. A full shared-element FLIP of the tapped cover into the sheet
 * is deliberately not used here (see NowPlayingSheet for the fallback scale
 * entrance) to keep routing simple and robust on low-end phones.
 */
export function RouteTransition() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
