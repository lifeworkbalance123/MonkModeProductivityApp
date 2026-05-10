'use client'

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COLLAPSE_ALL_EVENT,
  EXPAND_ALL_EVENT,
} from '@/components/ui/ExpandAllButton'

export interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
  /** Ignored in v1 — open state is not persisted. */
  storageKey?: string
  icon?: ReactNode
  className?: string
  /** Optional badge shown next to the title (e.g. habit count). */
  count?: number
  id?: string
  /** Extra classes for the panel below the summary (e.g. `relative` for overlays). */
  contentClassName?: string
  /** When false, does not listen for global expand/collapse-all (default true). */
  respondToDashboardExpandAll?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  storageKey: _storageKey,
  icon,
  className,
  count,
  id,
  contentClassName,
  respondToDashboardExpandAll = true,
}: CollapsibleSectionProps) {
  const panelId = useId()
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useLayoutEffect(() => {
    const el = detailsRef.current
    if (!el) return
    el.open = defaultExpanded
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- initial open only

  useEffect(() => {
    if (!respondToDashboardExpandAll) return
    const handleExpandAll = () => {
      const el = detailsRef.current
      if (el) el.open = true
    }
    const handleCollapseAll = () => {
      const el = detailsRef.current
      if (el) el.open = false
    }

    window.addEventListener(EXPAND_ALL_EVENT, handleExpandAll)
    window.addEventListener(COLLAPSE_ALL_EVENT, handleCollapseAll)

    return () => {
      window.removeEventListener(EXPAND_ALL_EVENT, handleExpandAll)
      window.removeEventListener(COLLAPSE_ALL_EVENT, handleCollapseAll)
    }
  }, [respondToDashboardExpandAll])

  return (
    <details
      ref={detailsRef}
      id={id}
      className={cn(
        'collapsible-section group mb-0 overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      <summary
        className="flex list-none cursor-pointer items-center justify-between gap-2 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/60 [&::-webkit-details-marker]:hidden"
        aria-controls={panelId}
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="shrink-0 text-muted-foreground">{icon}</span>
          ) : null}
          <span className="truncate font-medium text-primary">{title}</span>
          {count !== undefined ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {count}
            </span>
          ) : null}
        </div>
        <ChevronDown
          className="collapsible-section-chevron size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div
        id={panelId}
        className={cn(
          'collapsible-section-panel border-t border-border p-4',
          contentClassName,
        )}
      >
        {children}
      </div>
    </details>
  )
}
