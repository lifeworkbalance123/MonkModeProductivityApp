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
  BookOpen,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  proOnly?: boolean
  proDescription?: string
  /** When `proOnly` is true, controls the chip shown on locked nav items. */
  paywallBadge?: 'pro' | 'bonus'
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
  { href: '/tools', label: 'Tool Library', icon: BookOpen },
  { href: '/focus', label: 'Focus & Deep Work', icon: Timer },
  {
    href: '/sync',
    label: 'Cloud sync',
    icon: Cloud,
    proOnly: true,
    paywallBadge: 'bonus',
    proDescription:
      'Keep your monkcubed data backed up and in sync across devices with cloud storage.',
  },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export type NavGroup = { id: string; title: string; items: NavItem[] }

/**
 * Sidebar + mobile menu groups (single story everywhere):
 * Planning → schedule → week → board; then track, learn; Focus and Insights each get their own section.
 */
export const drawerNavGroups: NavGroup[] = [
  {
    id: 'planning',
    title: 'Planning',
    items: [
      allNavItems.find((i) => i.href === '/schedule')!,
      allNavItems.find((i) => i.href === '/planner')!,
      allNavItems.find((i) => i.href === '/kanban')!,
    ],
  },
  {
    id: 'tracking',
    title: 'Tracking',
    items: [
      allNavItems.find((i) => i.href === '/habits')!,
      allNavItems.find((i) => i.href === '/goals')!,
    ],
  },
  {
    id: 'learning',
    title: 'Learning',
    items: [
      allNavItems.find((i) => i.href === '/training')!,
      allNavItems.find((i) => i.href === '/videos')!,
      allNavItems.find((i) => i.href === '/tools')!,
    ],
  },
  {
    id: 'focus',
    title: 'Focus',
    items: [allNavItems.find((i) => i.href === '/focus')!],
  },
  {
    id: 'insights',
    title: 'Insights',
    items: [allNavItems.find((i) => i.href === '/analytics')!],
  },
  {
    id: 'system',
    title: 'System',
    items: [
      allNavItems.find((i) => i.href === '/sync')!,
      allNavItems.find((i) => i.href === '/settings')!,
    ],
  },
]

/** Daily (Today / Dashboard) + all drawer groups — used for sidebar + mobile menu. */
export const sidebarNavSections: NavGroup[] = [
  {
    id: 'daily',
    title: 'Daily',
    items: [
      allNavItems.find((i) => i.href === '/today')!,
      allNavItems.find((i) => i.href === '/dashboard')!,
    ],
  },
  ...drawerNavGroups,
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
