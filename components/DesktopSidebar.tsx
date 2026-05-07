'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { BonusBadge } from '@/components/bonus-badge'
import { ProBadge } from '@/components/pro-badge'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { PwaInstallButton } from '@/components/marketing/PwaInstallButton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useColorTheme } from '@/context/ColorThemeContext'
import { useSidebarNavCollapse } from '@/hooks/useSidebarNavCollapse'
import { SidebarLogoutButton } from '@/components/SidebarLogoutButton'
import { sidebarNavSections, type NavItem } from '@/lib/nav-config'
import { cn } from '@/lib/utils'

type Props = {
  showProGate: (item: NavItem) => boolean
  onProLocked: (description: string) => void
  programButtonText?: string
}

function ItemLink({
  item,
  active,
  showProGate,
  onProLocked,
  programButtonText,
}: {
  item: NavItem
  active: boolean
  showProGate: (item: NavItem) => boolean
  onProLocked: (description: string) => void
  programButtonText?: string
}) {
  const Icon = item.icon
  const displayLabel =
    item.href === '/today' && programButtonText?.trim()
      ? programButtonText
      : item.label
  const locked = showProGate(item)
  if (locked) {
    const Badge = item.paywallBadge === 'bonus' ? BonusBadge : ProBadge
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
        <span className="flex-1 truncate">{displayLabel}</span>
        <Badge className="shrink-0" />
      </button>
    )
  }
  return (
    <Link
      href={item.href}
      prefetch={false}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-accent/15 text-accent font-medium'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{displayLabel}</span>
    </Link>
  )
}

export function DesktopSidebar({ showProGate, onProLocked, programButtonText }: Props) {
  const pathname = usePathname()
  const { themeId } = useColorTheme()
  const { isActive, isGroupOpen, setGroupOpen } = useSidebarNavCollapse(pathname)

  return (
    <aside
      className="fixed left-0 top-0 z-[55] hidden h-screen w-64 flex-col border-r border-border bg-background/95 backdrop-blur-xl md:flex"
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
        {sidebarNavSections.map((group, index) => {
          const open = isGroupOpen(group)
          const panelId = `nav-section-${group.id}`

          return (
            <Collapsible
              key={group.id}
              open={open}
              onOpenChange={(next) => setGroupOpen(group.id, next)}
              className={cn(index > 0 && 'mt-3')}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  id={`${panelId}-trigger`}
                  aria-controls={panelId}
                  onMouseEnter={() => setGroupOpen(group.id, true)}
                  className={cn(
                    'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left',
                    'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                    'outline-none transition-colors hover:bg-secondary/60 hover:text-foreground',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  )}
                >
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200',
                      open ? 'rotate-0' : '-rotate-90',
                    )}
                    aria-hidden
                  />
                  <span className="flex-1">{group.title}</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent id={panelId} className="overflow-hidden">
                <div className="flex flex-col gap-0.5 pt-1 pl-1">
                  {group.items.map((item) => (
                    <ItemLink
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                      showProGate={showProGate}
                      onProLocked={onProLocked}
                      programButtonText={programButtonText}
                    />
                  ))}
                  {group.id === 'system' ? <SidebarLogoutButton /> : null}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </nav>
    </aside>
  )
}
