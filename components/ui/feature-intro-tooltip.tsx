'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTooltip } from '@/hooks/useTooltip'
import { cn } from '@/lib/utils'

export type FeatureIntroTooltipPosition = 'top' | 'bottom' | 'left' | 'right'

export type FeatureIntroTooltipProps = {
  /** Unique localStorage key, e.g. `tooltip_today` */
  id: string
  text: string
  children: ReactNode
  position?: FeatureIntroTooltipPosition
  className?: string
}

const bubblePosition: Record<
  FeatureIntroTooltipPosition,
  string
> = {
  bottom: 'left-1/2 top-full z-[100] mt-2 w-64 -translate-x-1/2',
  top: 'bottom-full left-1/2 z-[100] mb-2 w-64 -translate-x-1/2',
  left: 'right-full top-1/2 z-[100] mr-2 w-64 -translate-y-1/2',
  right: 'left-full top-1/2 z-[100] ml-2 w-64 -translate-y-1/2',
}

export function FeatureIntroTooltip({
  id,
  text,
  children,
  position = 'bottom',
  className = '',
}: FeatureIntroTooltipProps) {
  const { show, dismiss } = useTooltip(id)

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [show, dismiss])

  if (!show) return <>{children}</>

  return (
    <div className={cn('relative min-w-0', className)}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'absolute rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-lg',
          bubblePosition[position],
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-1 top-1 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Dismiss tip"
        >
          <X size={14} aria-hidden />
        </button>
        <p className="pr-6 leading-snug">{text}</p>
      </div>
    </div>
  )
}
