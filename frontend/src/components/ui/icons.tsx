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

export const ListMusicIcon = icon(
  <>
    <path d="M3 6h11" />
    <path d="M3 12h11" />
    <path d="M3 18h6" />
    <path d="M17 5v11" />
    <circle cx="15" cy="18" r="2.5" />
  </>,
)

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
)

export const CloseIcon = icon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </>,
)

export const ChevronDownIcon = icon(<path d="m6 10 6 6 6-6" />)
export const ChevronUpIcon = icon(<path d="m6 14 6-6 6 6" />)
export const ArrowLeftIcon = icon(
  <>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </>,
)

export const ArrowRightIcon = icon(
  <>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
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

export const ShuffleIcon = icon(
  <>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="M4 4l5 5" />
  </>,
)

export const RepeatIcon = icon(
  <>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </>,
)

export const VibrateIcon = icon(
  <>
    <path d="m2 8 2 2-2 2 2 2-2 2" />
    <path d="m22 8-2 2 2 2-2 2 2 2" />
    <rect x="8" y="5" width="8" height="14" rx="1.5" />
  </>,
)

export const VolumeIcon = icon(
  <>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </>,
)

export const VolumeMuteIcon = icon(
  <>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
    <path d="m22 9-6 6" />
    <path d="m16 9 6 6" />
  </>,
)

export const LoaderIcon = icon(
  <>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </>,
)

export const Music2Icon = icon(
  <>
    <circle cx="5.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="15.5" r="2.5" />
    <path d="M8 17.5V5l12-2.5v12.5" />
  </>,
)

export const ExternalLinkIcon = icon(
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>,
)
