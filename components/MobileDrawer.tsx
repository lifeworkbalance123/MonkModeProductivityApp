'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ProBadge } from '@/components/pro-badge'
import { drawerNavGroups, type NavItem } from '@/lib/nav-config'
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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

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
          className="flex max-h-[calc(100vh-8rem)] flex-col gap-4 overflow-y-auto p-4"
          aria-label="More navigation"
        >
          {drawerNavGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const locked = showProGate(item)
                  if (locked) {
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
                          <ProBadge />
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
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
