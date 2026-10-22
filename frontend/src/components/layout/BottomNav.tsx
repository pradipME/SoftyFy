import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

/** Four focused touch targets for the mobile listening room. */
export function BottomNav() {
  return (
    <nav className="sonic-bottom-nav md:hidden" aria-label="Main">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `sonic-mobile-link${isActive ? ' is-active' : ''}`}
        >
          {({ isActive }) => <><Icon /><span>{label}</span>{isActive && <span className="sr-only">Current page</span>}</>}
        </NavLink>
      ))}
    </nav>
  )
}
