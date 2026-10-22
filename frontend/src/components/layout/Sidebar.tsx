import { NavLink } from 'react-router-dom'
import { LIBRARIES, SONGS, SONGS_BY_LIBRARY } from '../../data/songs'
import { Music2Icon } from '../ui/icons'
import { NAV_ITEMS } from './navItems'

/** Desktop navigation for the SONIC NEXUS listening room. */
export function Sidebar() {
  return (
    <aside className="sonic-sidebar" aria-label="SONIC NEXUS navigation">
      <NavLink to="/" className="sonic-brand" aria-label="SONIC NEXUS home">
        <span className="sonic-brand-mark"><Music2Icon className="h-5 w-5" /></span>
        <span>
          <span className="sonic-brand-name">SONIC<br />NEXUS</span>
          <span className="sonic-brand-caption">Personal listening room</span>
        </span>
      </NavLink>

      <p className="sonic-side-label">Listen</p>
      <nav className="sonic-nav" aria-label="Main">
        {NAV_ITEMS.filter(({ to }) => to !== '/qwali').map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sonic-nav-link${isActive ? ' is-active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="sonic-side-label">Your collections</p>
      <nav className="sonic-collection-nav" aria-label="Collections">
        {LIBRARIES.slice(0, 5).map((name) => {
          const songs = SONGS_BY_LIBRARY[name] ?? []
          return (
            <NavLink
              key={name}
              to={`/library?album=${encodeURIComponent(name)}`}
              className="sonic-collection-link"
            >
              {songs[0]?.coverSrc ? (
                <img src={songs[0].coverSrc} alt="" className="sonic-collection-art" loading="lazy" />
              ) : (
                <span className="sonic-collection-art grid place-items-center bg-elevated"><Music2Icon className="h-4 w-4" /></span>
              )}
              <span>{name}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sonic-side-footer">
        <strong>{SONGS.length} tracks in rotation</strong>
        <span><i className="sonic-online-dot" />Your library, ready when you are</span>
      </div>
    </aside>
  )
}
