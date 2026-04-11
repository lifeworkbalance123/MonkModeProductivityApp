'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  icon: React.ReactNode
  heading: string
  subtext: string
  ctaLabel?: string
  ctaAction?: () => void
  secondaryLabel?: string
  secondaryAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  heading,
  subtext,
  ctaLabel,
  ctaAction,
  secondaryLabel,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center px-4 py-10 text-center transition-opacity duration-[400ms] ease-out',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center text-[#F59E0B]"
        aria-hidden
      >
        <span className="text-5xl leading-none [&>svg]:h-12 [&>svg]:w-12">
          {icon}
        </span>
      </div>
      <h2 className="text-xl font-medium text-white">{heading}</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-[#9CA3AF]">
        {subtext}
      </p>
      {ctaLabel && ctaAction ? (
        <Button
          type="button"
          onClick={ctaAction}
          className="mt-6 h-10 w-full max-w-[240px] bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
        >
          {ctaLabel}
        </Button>
      ) : null}
      {secondaryLabel && secondaryAction ? (
        <button
          type="button"
          onClick={secondaryAction}
          className="mt-3 min-h-11 w-full max-w-[240px] text-sm text-muted-foreground underline-offset-4 hover:text-[#9CA3AF] hover:underline md:min-h-0 md:w-auto"
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  )
}
