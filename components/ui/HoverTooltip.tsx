'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Lightbulb } from 'lucide-react'

interface HoverTooltipProps {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'auto'
  delay?: number
  className?: string
}

export function HoverTooltip({
  text,
  children,
  position = 'auto',
  delay = 300,
  className = '',
}: HoverTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom')
  const targetRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (!targetRef.current) return

      if (position === 'auto') {
        const rect = targetRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const tooltipHeight = 80
        setTooltipPosition(spaceBelow < tooltipHeight ? 'top' : 'bottom')
      } else {
        setTooltipPosition(position)
      }

      setVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={targetRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={showTooltip}
      onTouchEnd={hideTooltip}
      onTouchCancel={hideTooltip}
    >
      {children}

      {visible ? (
        <div
          className={`absolute z-50 max-w-xs break-words rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg animate-in fade-in zoom-in duration-150 ${
            tooltipPosition === 'bottom'
              ? 'left-1/2 top-full mt-1 -translate-x-1/2'
              : 'bottom-full left-1/2 mb-1 -translate-x-1/2'
          }`}
          style={{ whiteSpace: 'normal' }}
          role="tooltip"
        >
          <div
            className={`absolute h-2 w-2 rotate-45 bg-popover ${
              tooltipPosition === 'bottom'
                ? '-top-1 left-1/2 -translate-x-1/2'
                : '-bottom-1 left-1/2 -translate-x-1/2'
            }`}
            aria-hidden
          />
          <span className="flex gap-2 text-left">
            <Lightbulb
              size={14}
              className="mt-0.5 shrink-0 text-amber-500"
              aria-hidden
            />
            <span className="min-w-0 leading-snug">{text}</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}
