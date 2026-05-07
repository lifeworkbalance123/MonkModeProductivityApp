'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { bottomTabItems } from '@/lib/nav-config'
import { cn } from '@/lib/utils'

const DRAWER_PATH_PREFIXES = [
  '/schedule',
  '/planner',
  '/kanban',
  '/habits',
  '/goals',
  '/training',
  '/videos',
  '/sync',
  '/settings',
]

function isDrawerSectionActive(pathname: string) {
  return DRAWER_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

type Props = {
  onOpenMenu: () => void
  menuOpen: boolean
  showMenuHint: boolean
  onDismissMenuHint: () => void
  programButtonText?: string
}

export function MobileBottomNav({
  onOpenMenu,
  menuOpen,
  showMenuHint,
  onDismissMenuHint,
  programButtonText,
}: Props) {
  const pathname = usePathname()

  function tabActive(href: string) {
    if (href === '/today') return pathname === '/today'
    if (href === '/dashboard')
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
    if (href === '/focus')
      return pathname === '/focus' || pathname.startsWith('/focus/')
    if (href === '/analytics')
      return pathname === '/analytics' || pathname.startsWith('/analytics/')
    return false
  }

  const menuActive = menuOpen || isDrawerSectionActive(pathname)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0 px-1 pt-1">
        {bottomTabItems.map(({ href, label, icon: Icon }) => {
          const active = tabActive(href)
          const displayLabel =
            href === '/today' && programButtonText?.trim()
              ? programButtonText
              : label
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
                active
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'text-accent')} />
              <span className="truncate">{displayLabel}</span>
            </Link>
          )
        })}

        <div className="relative flex min-w-0 flex-1 flex-col items-center">
          {showMenuHint ? (
            <div
              className="absolute bottom-[calc(100%+6px)] left-1/2 z-10 w-max max-w-[min(12rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-center text-[10px] text-popover-foreground shadow-md"
              role="status"
            >
              More tools here
              <span
                className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-popover"
                aria-hidden
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (showMenuHint) onDismissMenuHint()
              onOpenMenu()
            }}
            className={cn(
              'flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
              menuActive
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu
              className={cn('h-5 w-5 shrink-0', menuActive && 'text-accent')}
            />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
