import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAV_ITEMS } from './navItems'

/** Four focused touch targets for the mobile listening room. */
export function BottomNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="sonic-bottom-nav md:hidden" aria-label="Main">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `sonic-mobile-link${isActive ? ' is-active' : ''}`}
        >
          {({ isActive }) => <>
            {isActive && <motion.span className="metro-nav-indicator" layoutId="metro-nav-indicator" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <motion.span className="metro-nav-icon" animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.06 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}><Icon /></motion.span>
            <span>{label}</span>{isActive && <span className="sr-only">Current page</span>}
          </>}
        </NavLink>
      ))}
    </nav>
  )
}
