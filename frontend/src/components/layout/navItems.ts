import type { ComponentType, SVGProps } from 'react'
import { HomeIcon, ListMusicIcon, SearchIcon } from '../ui/icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Only the Home tab should match exactly (so /search doesn't highlight Home). */
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/library', label: 'Library', icon: ListMusicIcon },
]
