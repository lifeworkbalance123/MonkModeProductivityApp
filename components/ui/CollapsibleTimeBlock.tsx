'use client'

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COLLAPSE_ALL_EVENT,
  EXPAND_ALL_EVENT,
} from '@/components/ui/ExpandAllButton'

export interface CollapsibleTimeBlockProps {
  time: string
  title: string
  subtitle?: string
  children: ReactNode
  defaultExpanded?: boolean
  /** Persist open/closed state in localStorage when set. */
  storageKey?: string
  className?: string
  /** When false, ignores global expand/collapse-all from the dashboard toolbar. */
  respondToDashboardExpandAll?: boolean
}

export function CollapsibleTimeBlock({
  time,
  title,
  subtitle,
  children,
  defaultExpanded = true,
  storageKey,
  className,
  respondToDashboardExpandAll = true,
}: CollapsibleTimeBlockProps) {
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
        'mb-2 overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="shrink-0 text-muted-foreground" aria-hidden>
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
          <span className="shrink-0 font-medium text-foreground tabular-nums">{time}</span>
          <span className="min-w-0 text-foreground">{title}</span>
          {subtitle ? (
            <span className="min-w-0 text-sm text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>
      </button>

      {isExpanded ? (
        <div id={panelId} className="border-t border-border p-3 pt-0">
          {children}
        </div>
      ) : null}
    </div>
  )
}
