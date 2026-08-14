import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

/**
 * Mobile-only bottom tab bar (Home / Search / Library). Frosted glass so the
 * ambient layer bleeds through, with safe-area padding for notched phones.
 */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-base/65 backdrop-blur-xl md:hidden"
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
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'bg-accent/15' : ''
                  }`}
                >
                  <Icon className={`h-[22px] w-[22px] ${isActive ? 'text-accent' : ''}`} />
                </span>
                <span className="text-[11px] font-semibold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
