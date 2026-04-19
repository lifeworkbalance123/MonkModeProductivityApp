'use client'

import { useAuth } from '@/context/AuthContext'
import { useTrialBanner } from '@/hooks/use-trial-banner'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'

function useShowTrialStrip() {
  const { user } = useAuth()
  const trial = useTrialBanner()
  const { isPro, isLoading: planLoading } = usePlan()
  return !!user && trial.visible && !planLoading && !isPro
}

/**
 * Padding for main content below `Navigation` (logged-in app shell: top bar + bottom tabs on mobile, sidebar on md+).
 * Logged-out / marketing: classic top-nav offset only.
 */
export function MainShell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const showTrialStrip = useShowTrialStrip()

  return (
    <div
      className={cn(
        user
          ? showTrialStrip
            ? 'pt-[7.5rem] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pt-14 md:pb-8 md:pl-64'
            : 'pt-14 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pt-6 md:pb-8 md:pl-64'
          : 'pt-20',
        className,
      )}
    >
      {children}
    </div>
  )
}
