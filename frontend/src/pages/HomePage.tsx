import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { AddMusicButton } from '../features/upload/AddMusicButton'
import {
  DiscIcon,
  HeartIcon,
  ListMusicIcon,
  MusicIcon,
  UsersIcon,
} from '../components/ui/icons'

const sections = [
  {
    to: '/songs',
    title: 'Songs',
    description: 'Browse every track in your library.',
    icon: <MusicIcon className="h-6 w-6" />,
    accent: 'from-violet-600 to-fuchsia-500',
  },
  {
    to: '/artists',
    title: 'Artists',
    description: 'Discover the people behind the music.',
    icon: <UsersIcon className="h-6 w-6" />,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    to: '/albums',
    title: 'Albums',
    description: 'Explore full releases.',
    icon: <DiscIcon className="h-6 w-6" />,
    accent: 'from-amber-500 to-rose-500',
  },
  {
    to: '/playlists',
    title: 'Playlists',
    description: 'Create and manage your own collections.',
    icon: <ListMusicIcon className="h-6 w-6" />,
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    to: '/favorites',
    title: 'Favorites',
    description: 'The songs you love most.',
    icon: <HeartIcon className="h-6 w-6" />,
    accent: 'from-indigo-500 to-purple-600',
  },
]

export function HomePage() {
  return (
    <>
      <PageHeader
        title="Your library"
        description="Everything in one place. Press play on any track to start listening."
        actions={<AddMusicButton />}
      />
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="surface-card group flex flex-col items-center gap-4 p-6 transition-colors hover:border-accent/30 cursor-pointer"
          >
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${section.accent} text-white`}
            >
              {section.icon}
            </span>
            <div>
              <span className="block text-lg font-semibold group-hover:text-accent-strong">
                {section.title}
              </span>
              <span className="mt-1 block text-sm text-muted">{section.description}</span>
            </div>
          </Link>
        ))}
      </section>
    </>
  )
}
