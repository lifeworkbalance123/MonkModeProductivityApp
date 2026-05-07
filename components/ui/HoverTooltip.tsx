'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

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
          className={`absolute z-50 max-w-xs break-words rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg animate-in fade-in zoom-in duration-150 ${
            tooltipPosition === 'bottom'
              ? 'left-1/2 top-full mt-1 -translate-x-1/2'
              : 'bottom-full left-1/2 mb-1 -translate-x-1/2'
          }`}
          style={{ whiteSpace: 'normal' }}
          role="tooltip"
        >
          <div
            className={`absolute h-2 w-2 rotate-45 bg-gray-900 ${
              tooltipPosition === 'bottom'
                ? '-top-1 left-1/2 -translate-x-1/2'
                : '-bottom-1 left-1/2 -translate-x-1/2'
            }`}
          />
          {text}
        </div>
      ) : null}
    </div>
  )
}
