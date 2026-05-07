'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { BonusBadge } from '@/components/bonus-badge'
import { ProBadge } from '@/components/pro-badge'
import { useSidebarNavCollapse } from '@/hooks/useSidebarNavCollapse'
import { SidebarLogoutButton } from '@/components/SidebarLogoutButton'
import { sidebarNavSections, type NavItem } from '@/lib/nav-config'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  showProGate: (item: NavItem) => boolean
  onProLocked: (description: string) => void
}

export function MobileDrawer({
  open,
  onOpenChange,
  showProGate,
  onProLocked,
}: Props) {
  const pathname = usePathname()
  const { isActive, isGroupOpen, setGroupOpen } = useSidebarNavCollapse(pathname)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-0">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            More tools and settings grouped by category
          </SheetDescription>
        </SheetHeader>
        <nav
          className="flex max-h-[calc(100vh-8rem)] flex-col gap-1 overflow-y-auto p-4"
          aria-label="More navigation"
        >
          {sidebarNavSections.map((group, index) => {
            const expanded = isGroupOpen(group)
            const panelId = `drawer-nav-${group.id}`

            return (
              <Collapsible
                key={group.id}
                open={expanded}
                onOpenChange={(next) => setGroupOpen(group.id, next)}
                className={cn(index > 0 && 'mt-2')}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    aria-controls={panelId}
                    className={cn(
                      'flex w-full items-center gap-1 rounded-md px-2 py-2 text-left',
                      'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                      'outline-none transition-colors hover:bg-secondary/60 hover:text-foreground',
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200',
                        expanded ? 'rotate-0' : '-rotate-90',
                      )}
                      aria-hidden
                    />
                    <span className="flex-1">{group.title}</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent id={panelId} className="overflow-hidden">
                  <ul className="flex flex-col gap-1 pt-1 pl-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const locked = showProGate(item)
                      if (locked) {
                        const Badge = item.paywallBadge === 'bonus' ? BonusBadge : ProBadge
                        return (
                          <li key={item.href}>
                            <button
                              type="button"
                              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary"
                              onClick={() => {
                                onProLocked(
                                  item.proDescription ??
                                    'Upgrade to Pro to unlock this feature.',
                                )
                                onOpenChange(false)
                              }}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1">{item.label}</span>
                              <Badge />
                            </button>
                          </li>
                        )
                      }
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive(item.href)
                                ? 'bg-accent/15 font-medium text-accent'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                            )}
                            onClick={() => onOpenChange(false)}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                    {group.id === 'system' ? (
                      <li>
                        <SidebarLogoutButton
                          className="min-h-11 gap-3"
                          onAfterClick={() => onOpenChange(false)}
                        />
                      </li>
                    ) : null}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
