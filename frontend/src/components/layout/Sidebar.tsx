import { NavLink } from 'react-router-dom'
import { SONGS } from '../../data/songs'
import { NAV_ITEMS } from './navItems'

/** Desktop-only left navigation rail (replaces the mobile bottom nav). */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-4 border-r border-line bg-base p-5 md:flex">
      {/* Logo / brand */}
      <div className="sidebar-logo-bg">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-[0_0_12px_rgba(29,185,84,0.5)]">
            <img src="/favicon.png" alt="" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none tracking-tight text-fg">SoftyFy</p>
            <p className="text-[10px] leading-none text-muted">Music Player</p>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white/[0.08] text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-muted hover:bg-white/[0.04] hover:text-fg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-accent/15' : ''
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-accent' : ''}`} />
                </span>
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Library stats */}
      <div className="mt-auto rounded-xl border border-line/50 bg-surface/40 p-3">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-dim">Library</p>
        <p className="text-sm text-fg font-medium">{SONGS.length} songs</p>
        <p className="text-xs text-muted">No account needed</p>
      </div>
    </aside>
  )
}
