import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  CheckSquare,
  Target,
  PlayCircle,
  Settings,
  BarChart2,
  Cloud,
  Timer,
  Sunrise,
  Clapperboard,
  LayoutGrid,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  proOnly?: boolean
  proDescription?: string
}

/** All primary app links (single list — used for legacy / marketing). */
export const allNavItems: NavItem[] = [
  { href: '/today', label: 'Today', icon: Sunrise },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule', label: 'Time Schedule', icon: Clock },
  { href: '/planner', label: 'Weekly Planner', icon: Calendar },
  { href: '/habits', label: 'Habits', icon: CheckSquare },
  { href: '/goals', label: 'Goals', icon: Target },
  {
    href: '/kanban',
    label: 'Kanban',
    icon: LayoutGrid,
    proOnly: true,
    proDescription:
      'Organize your tasks on a drag-and-drop board so you can see workflow at a glance.',
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart2,
    proOnly: true,
    proDescription:
      'Track streaks, completion rates, and trends to understand how your habits compound.',
  },
  { href: '/training', label: 'Training', icon: PlayCircle },
  { href: '/videos', label: 'Video library', icon: Clapperboard },
  { href: '/focus', label: 'Focus & Deep Work', icon: Timer },
  {
    href: '/sync',
    label: 'Cloud sync',
    icon: Cloud,
    proOnly: true,
    proDescription:
      'Keep your monkcubed data backed up and in sync across devices with cloud storage.',
  },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export type NavGroup = { title: string; items: NavItem[] }

/** Desktop sidebar + mobile drawer (excludes bottom-tab destinations). */
export const drawerNavGroups: NavGroup[] = [
  {
    title: 'Planning',
    items: [
      allNavItems.find((i) => i.href === '/schedule')!,
      allNavItems.find((i) => i.href === '/planner')!,
      allNavItems.find((i) => i.href === '/kanban')!,
    ],
  },
  {
    title: 'Tracking',
    items: [
      allNavItems.find((i) => i.href === '/habits')!,
      allNavItems.find((i) => i.href === '/goals')!,
    ],
  },
  {
    title: 'Learning',
    items: [
      allNavItems.find((i) => i.href === '/training')!,
      allNavItems.find((i) => i.href === '/videos')!,
    ],
  },
  {
    title: 'System',
    items: [
      allNavItems.find((i) => i.href === '/sync')!,
      allNavItems.find((i) => i.href === '/settings')!,
    ],
  },
]

/** Desktop-only extra groups (Focus + Insights) — not duplicated in mobile drawer. */
export const desktopOnlyGroups: NavGroup[] = [
  {
    title: 'Focus',
    items: [allNavItems.find((i) => i.href === '/focus')!],
  },
  {
    title: 'Insights',
    items: [allNavItems.find((i) => i.href === '/analytics')!],
  },
]

/** Fixed bottom tabs (mobile, logged in). */
export const bottomTabItems: {
  href: string
  label: string
  icon: LucideIcon
}[] = [
  { href: '/today', label: 'Today', icon: Sunrise },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/focus', label: 'Focus', icon: Timer },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
]
