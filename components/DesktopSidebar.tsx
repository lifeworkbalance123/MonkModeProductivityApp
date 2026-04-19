'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProBadge } from '@/components/pro-badge'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { PwaInstallButton } from '@/components/marketing/PwaInstallButton'
import { useColorTheme } from '@/context/ColorThemeContext'
import {
  allNavItems,
  desktopOnlyGroups,
  drawerNavGroups,
  type NavItem,
} from '@/lib/nav-config'
import { cn } from '@/lib/utils'

type Props = {
  showProGate: (item: NavItem) => boolean
  onProLocked: (description: string) => void
}

function ItemLink({
  item,
  active,
  showProGate,
  onProLocked,
}: {
  item: NavItem
  active: boolean
  showProGate: (item: NavItem) => boolean
  onProLocked: (description: string) => void
}) {
  const Icon = item.icon
  const locked = showProGate(item)
  if (locked) {
    return (
      <button
        type="button"
        onClick={() =>
          onProLocked(
            item.proDescription ?? 'Upgrade to Pro to unlock this feature.',
          )
        }
        className={cn(
          'relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
          'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-80" />
        <span className="flex-1 truncate">{item.label}</span>
        <ProBadge className="shrink-0" />
      </button>
    )
  }
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-accent/15 text-accent font-medium'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function DesktopSidebar({ showProGate, onProLocked }: Props) {
  const pathname = usePathname()
  const { themeId } = useColorTheme()

  const today = allNavItems.find((i) => i.href === '/today')!
  const dashboard = allNavItems.find((i) => i.href === '/dashboard')!

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-background/95 backdrop-blur-xl md:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="monk cubed — home">
          <MonkCubedLogo
            variant={themeId === 'zen' ? 'onLight' : 'onDark'}
            className="text-lg"
          />
        </Link>
        <PwaInstallButton />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Daily
        </p>
        <ItemLink
          item={today}
          active={isActive(today.href)}
          showProGate={showProGate}
          onProLocked={onProLocked}
        />
        <ItemLink
          item={dashboard}
          active={isActive(dashboard.href)}
          showProGate={showProGate}
          onProLocked={onProLocked}
        />

        {drawerNavGroups.map((group) => (
          <div key={group.title} className="mt-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <ItemLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  showProGate={showProGate}
                  onProLocked={onProLocked}
                />
              ))}
            </div>
          </div>
        ))}

        {desktopOnlyGroups.map((group) => (
          <div key={group.title} className="mt-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <ItemLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  showProGate={showProGate}
                  onProLocked={onProLocked}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
