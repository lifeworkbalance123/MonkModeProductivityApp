'use client'

import * as React from 'react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Radix compound API — use `TooltipRoot` + `TooltipTrigger` + `TooltipContent`
// (e.g. sidebar, weekly planner). `TooltipProvider` wraps subtrees that need
// shared delay / hoverable settings.
// ---------------------------------------------------------------------------

function TooltipProvider({
  delayDuration = 300,
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    />
  )
}

function TooltipRoot({
  delayDuration = 300,
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      <TooltipPrimitive.Root
        data-slot="tooltip"
        delayDuration={delayDuration}
        disableHoverableContent={disableHoverableContent}
        {...props}
      />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

// ---------------------------------------------------------------------------
// Simple `Tooltip` — string content, hover + focus, delay (no Radix).
// Hover-only: no always-on mode. Use default cursor-help on the wrapper, or
// pass cursor-help on the child trigger (e.g. <span className="cursor-help">ⓘ</span>).
// ---------------------------------------------------------------------------

export interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** ms before showing */
  delay?: number
  /** Merged onto the outer wrapper (default includes cursor-help). */
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  } as const

  const arrowClasses =
    position === 'top'
      ? '-bottom-1 left-1/2 -translate-x-1/2'
      : position === 'bottom'
        ? '-top-1 left-1/2 -translate-x-1/2'
        : position === 'left'
          ? '-right-1 top-1/2 -translate-y-1/2'
          : '-left-1 top-1/2 -translate-y-1/2'

  return (
    <div
      className={cn('relative inline-flex cursor-help', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible ? (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 max-w-xs whitespace-normal rounded-md px-2 py-1.5 text-xs shadow-lg',
            'bg-foreground text-background',
            positionClasses[position],
          )}
        >
          {content}
          <div
            className={cn('absolute size-2 rotate-45 bg-foreground', arrowClasses)}
            aria-hidden
          />
        </div>
      ) : null}
    </div>
  )
}

export { TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider }
