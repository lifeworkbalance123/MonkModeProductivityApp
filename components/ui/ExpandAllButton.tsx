'use client'

import { useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Global events collapsible sections listen for. */
export const EXPAND_ALL_EVENT = 'expand-all-sections'
export const COLLAPSE_ALL_EVENT = 'collapse-all-sections'

export interface ExpandAllButtonProps {
  className?: string
}

export function ExpandAllButton({ className }: ExpandAllButtonProps) {
  const [allExpanded, setAllExpanded] = useState(false)

  const toggleAll = () => {
    const newState = !allExpanded
    setAllExpanded(newState)
    window.dispatchEvent(
      new CustomEvent(newState ? EXPAND_ALL_EVENT : COLLAPSE_ALL_EVENT),
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleAll}
      className={cn(
        'h-8 gap-1.5 text-xs font-medium text-foreground',
        className,
      )}
    >
      <ChevronsUpDown className="size-3.5 shrink-0" aria-hidden />
      {allExpanded ? 'Collapse all' : 'Expand all'}
    </Button>
  )
}
