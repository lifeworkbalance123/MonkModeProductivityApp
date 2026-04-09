'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ErrorBannerProps = {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  className,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm',
        'border-l-4 border-l-[#F59E0B]',
        className,
      )}
    >
      <p className="min-w-0 flex-1 text-[14px] leading-snug">{message}</p>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-[14px] font-medium text-[#F59E0B] hover:underline"
          >
            Retry
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
