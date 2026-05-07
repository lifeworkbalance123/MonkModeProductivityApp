'use client'

import { useEffect, type ReactNode } from 'react'
import { ChevronDown, Lightbulb, X } from 'lucide-react'
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
  bottom: 'left-1/2 top-full z-[100] mt-2 w-64 max-w-[min(100vw-2rem,16rem)] -translate-x-1/2',
  top: 'bottom-full left-1/2 z-[100] mb-2 w-64 max-w-[min(100vw-2rem,16rem)] -translate-x-1/2',
  left: 'right-full top-1/2 z-[100] mr-2 w-64 max-w-[min(100vw-2rem,16rem)] -translate-y-1/2',
  right: 'left-full top-1/2 z-[100] ml-2 w-64 max-w-[min(100vw-2rem,16rem)] -translate-y-1/2',
}

const chipPosition: Record<FeatureIntroTooltipPosition, string> = {
  bottom: 'left-1/2 top-full z-[100] mt-2 -translate-x-1/2',
  top: 'bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2',
  left: 'right-full top-1/2 z-[100] mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 z-[100] ml-2 -translate-y-1/2',
}

export function FeatureIntroTooltip({
  id,
  text,
  children,
  position = 'bottom',
  className = '',
}: FeatureIntroTooltipProps) {
  const { visibility, dismiss, collapse, expand } = useTooltip(id)

  useEffect(() => {
    if (visibility !== 'expanded') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') collapse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visibility, collapse])

  if (visibility === 'hidden') return <>{children}</>

  return (
    <div className={cn('relative min-w-0', className)}>
      {children}
      {visibility === 'expanded' ? (
        <div
          role="region"
          aria-label="Feature tip"
          aria-expanded
          className={cn(
            'absolute rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-lg',
            bubblePosition[position],
          )}
        >
          <div className="flex gap-2">
            <p className="min-w-0 flex-1 pr-1 leading-snug">{text}</p>
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={collapse}
                className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Collapse tip"
                title="Collapse"
              >
                <ChevronDown size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Dismiss tip permanently"
                title="Close"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn('absolute', chipPosition[position])}>
          <button
            type="button"
            onClick={expand}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm hover:bg-muted"
            aria-expanded={false}
            aria-label="Expand feature tip"
          >
            <span className="flex items-center gap-1">
              <Lightbulb
                size={14}
                className="shrink-0 text-amber-500"
                aria-label="Tip"
              />
              <span aria-hidden="true">Tip</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
