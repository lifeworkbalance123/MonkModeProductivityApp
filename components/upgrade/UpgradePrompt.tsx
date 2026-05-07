'use client'

import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const shellClassName = cn(
  'upgrade-prompt rounded-xl border border-primary/30 bg-primary/5 px-4 py-4 text-center shadow-sm',
  '[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground',
  '[&_p+_p]:mt-2',
  '[&_button]:mt-4 [&_button]:inline-flex [&_button]:h-11 [&_button]:min-w-[200px] [&_button]:items-center [&_button]:justify-center [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-primary [&_button]:px-6 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-primary-foreground [&_button]:transition-colors [&_button:hover]:bg-primary/90',
)

type UpgradePromptProps = {
  className?: string
  /**
   * Custom layout (e.g. your own paragraphs + button).
   * When omitted, the default Pro trial copy + CTA is shown.
   */
  children?: ReactNode
  /** Default mode only: called when “Try Pro Free for 14 Days” is clicked */
  onTryPro?: () => void | Promise<void>
  tryProDisabled?: boolean
  tryProLoading?: boolean
}

/**
 * Compact upgrade callout — use with children or rely on built-in copy + CTA.
 *
 * @example
 * ```tsx
 * <UpgradePrompt>
 *   <p>✨ Unlimited habits, timeboxes, and Deep Work are Pro features.</p>
 *   <p>Start your 14-day free trial → No card required.</p>
 *   <button type="button" onClick={...}>Try Pro Free for 14 Days</button>
 * </UpgradePrompt>
 * ```
 */
export function UpgradePrompt({
  children,
  className,
  onTryPro,
  tryProDisabled,
  tryProLoading,
}: UpgradePromptProps) {
  if (children != null) {
    return (
      <div className={cn(shellClassName, className)} data-upgrade-prompt>
        {children}
      </div>
    )
  }

  return (
    <div className={cn(shellClassName, className)} data-upgrade-prompt>
      <p>✨ Unlimited habits, timeboxes, and Deep Work are Pro features.</p>
      <p>Start your 14-day free trial → No card required.</p>
      <Button
        type="button"
        className="h-11 min-w-[200px] bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
        disabled={tryProDisabled || tryProLoading}
        onClick={() => void onTryPro?.()}
      >
        {tryProLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          'Try Pro Free for 14 Days'
        )}
      </Button>
    </div>
  )
}
