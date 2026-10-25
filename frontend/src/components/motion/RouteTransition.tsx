import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Keep route changes immediate; the small lift animates without waiting for an
 * exiting Outlet, which can leave a blank frame while album details mount.
 */
export function RouteTransition() {
  const location = useLocation()
  return (
    <motion.div
      key={`${location.pathname}${location.search}`}
      initial={{ y: 5 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
    >
      <Outlet />
    </motion.div>
  )
}
