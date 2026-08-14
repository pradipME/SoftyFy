import { NavLink } from 'react-router-dom'
import { SONGS } from '../../data/songs'
import { NAV_ITEMS } from './navItems'

/** Desktop-only left navigation rail (replaces the mobile bottom nav). */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 border-r border-line bg-base p-5 md:flex">
      <NavLink to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-fg">
        <img src="/favicon.png" alt="" className="h-7 w-7" />
        SoftyFy
      </NavLink>
      <nav className="flex flex-col gap-1" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive ? 'bg-surface text-fg' : 'text-muted hover:text-fg'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <p className="mt-auto text-xs text-dim">
        {SONGS.length} local tracks · no account needed
      </p>
    </aside>
  )
}
