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
        'flex min-h-0 flex-1 flex-col',
        user
          ? showTrialStrip
            ? 'pt-[7.5rem] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pt-14 md:pb-8'
            : 'pt-14 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pt-0 md:pb-8'
          : 'pt-20',
        className,
      )}
    >
      {/* md+: main must not capture clicks over the fixed sidebar. Margin alone is not enough in some browsers — pass events through the main scroll layer and only re-enable hits on the content column. */}
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-auto',
          user && 'md:pointer-events-none',
        )}
      >
        {user ? (
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col md:min-h-screen',
              'pointer-events-auto md:ml-64',
            )}
          >
            <div className="p-3">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
