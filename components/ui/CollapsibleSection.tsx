'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type Props = {
  title: string
  storageKey?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, storageKey, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const key = useMemo(() => (storageKey ? `collapsible:${storageKey}` : null), [storageKey])

  useEffect(() => {
    if (!key) return
    try {
      const raw = localStorage.getItem(key)
      if (raw === '0') setOpen(false)
      if (raw === '1') setOpen(true)
    } catch {
      // ignore
    }
  }, [key])

  useEffect(() => {
    if (!key) return
    try {
      localStorage.setItem(key, open ? '1' : '0')
    } catch {
      // ignore
    }
  }, [key, open])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label={open ? 'Collapse section' : 'Expand section'}
          >
            <ChevronDown className={open ? 'h-4 w-4 rotate-180 transition-transform' : 'h-4 w-4 transition-transform'} />
            {open ? 'Hide' : 'Show'}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

