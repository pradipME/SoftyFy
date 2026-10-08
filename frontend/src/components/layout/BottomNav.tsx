import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

/**
 * Mobile-only bottom tab bar (Home / Search / Library). Frosted glass so the
 * ambient layer bleeds through, with safe-area padding for notched phones.
 */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-base/70 backdrop-blur-2xl md:hidden"
      aria-label="Main"
    >
      <div className="grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[60px] flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                isActive ? 'text-fg' : 'text-muted hover:text-fg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive ? 'bg-accent/20 shadow-[0_0_10px_rgba(29,185,84,0.2)]' : ''
                  }`}
                >
                  <Icon className={`h-[22px] w-[22px] transition-all duration-200 ${isActive ? 'text-accent scale-110' : ''}`} />
                </span>
                <span className={`text-[11px] font-semibold transition-colors ${isActive ? 'text-fg' : 'text-muted'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
