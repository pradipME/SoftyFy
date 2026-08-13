import type { ReactNode, SVGProps } from 'react'

function icon(paths: ReactNode) {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    )
  }
}

export const HomeIcon = icon(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </>,
)

export const MusicIcon = icon(
  <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>,
)

export const UserIcon = icon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </>,
)

export const UsersIcon = icon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M18.5 14.7c1.8.8 2.8 2.6 3.2 5.3" />
  </>,
)

export const DiscIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" />
  </>,
)

export const ListMusicIcon = icon(
  <>
    <path d="M3 6h11" />
    <path d="M3 12h11" />
    <path d="M3 18h6" />
    <path d="M17 5v11" />
    <circle cx="15" cy="18" r="2.5" />
  </>,
)

export const HeartIcon = icon(
  <path d="M12 20s-7-4.4-9.2-8.4C1.2 8.8 2.9 6 5.6 6c1.9 0 3.2 1 4.4 2.7C11.2 7 12.5 6 14.4 6c2.7 0 4.4 2.8 2.8 5.6C17 15.6 12 20 12 20Z" />,
)

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
)

export const PlusIcon = icon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
)

export const CloseIcon = icon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </>,
)

export const TrashIcon = icon(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </>,
)

export const EditIcon = icon(
  <>
    <path d="M4 20h4l11-11-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </>,
)

export const ChevronUpIcon = icon(<path d="m6 14 6-6 6 6" />)
export const ChevronDownIcon = icon(<path d="m6 10 6 6 6-6" />)
export const ChevronLeftIcon = icon(<path d="m14 6-6 6 6 6" />)
export const ChevronRightIcon = icon(<path d="m10 6 6 6-6 6" />)
export const ArrowLeftIcon = icon(
  <>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </>,
)

export const PlayIcon = icon(<path d="M8 5v14l11-7Z" />)

export const PauseIcon = icon(
  <>
    <path d="M9 5v14" />
    <path d="M15 5v14" />
  </>,
)

export const SkipBackIcon = icon(
  <>
    <path d="M19 20 9 12l10-8v16Z" />
    <path d="M5 4v16" />
  </>,
)

export const SkipForwardIcon = icon(
  <>
    <path d="M5 4v16l10-8L5 4Z" />
    <path d="M19 4v16" />
  </>,
)

export const MenuIcon = icon(
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>,
)

export const LinkIcon = icon(
  <>
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
  </>,
)

export const LoaderIcon = icon(
  <>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </>,
)
