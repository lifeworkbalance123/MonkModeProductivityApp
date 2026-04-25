'use client'

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COLLAPSE_ALL_EVENT,
  EXPAND_ALL_EVENT,
} from '@/components/ui/ExpandAllButton'

export interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
  storageKey?: string
  icon?: ReactNode
  className?: string
  /** When false, does not listen for global expand/collapse-all (default true). */
  respondToDashboardExpandAll?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  storageKey,
  icon,
  className,
  respondToDashboardExpandAll = true,
}: CollapsibleSectionProps) {
  const panelId = useId()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  useEffect(() => {
    if (!respondToDashboardExpandAll) return
    const handleExpandAll = () => setIsExpanded(true)
    const handleCollapseAll = () => setIsExpanded(false)

    window.addEventListener(EXPAND_ALL_EVENT, handleExpandAll)
    window.addEventListener(COLLAPSE_ALL_EVENT, handleCollapseAll)

    return () => {
      window.removeEventListener(EXPAND_ALL_EVENT, handleExpandAll)
      window.removeEventListener(COLLAPSE_ALL_EVENT, handleCollapseAll)
    }
  }, [])

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved !== null) {
        setIsExpanded(saved === 'true')
      }
    } catch {
      /* private mode */
    }
  }, [storageKey])

  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(next))
        } catch {
          /* ignore */
        }
      }
      return next
    })
  }, [storageKey])

  return (
    <div
      className={cn(
        'mb-4 overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60"
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
          <span className="truncate font-medium text-foreground">{title}</span>
        </div>
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          {isExpanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
        </span>
      </button>

      {isExpanded ? (
        <div id={panelId} className="border-t border-border p-4">
          {children}
        </div>
      ) : null}
    </div>
  )
}
