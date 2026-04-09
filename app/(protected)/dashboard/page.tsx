'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { DashboardApp } from '@/components/dashboard-app'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useMonkData } from '@/hooks/use-monk-data'
import { useTrialBanner } from '@/hooks/use-trial-banner'
import { useAuth } from '@/context/AuthContext'
import { captureEvent } from '@/lib/analytics'

export default function DashboardPage() {
  const { data, setData, ready, dataContext, loadError, reload } = useMonkData()
  const trial = useTrialBanner()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id || !trial.visible || trial.expired || !ready) return
    const key = `trial_started_tracked_${user.id}`
    if (localStorage.getItem(key) === '1') return
    localStorage.setItem(key, '1')
    captureEvent('trial_started', {
      trial_end_date: new Date(
        Date.now() + trial.daysLeft * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
  }, [ready, trial.daysLeft, trial.expired, trial.visible, user?.id])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {loadError ? (
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-2">
          <ErrorBanner
            message={loadError}
            onRetry={() => void reload()}
          />
        </div>
      ) : null}
      {!ready ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Loading data</span>
        </div>
      ) : (
        <DashboardApp
          data={data}
          onChange={setData}
          dataContext={dataContext}
          userId={user?.id}
        />
      )}
    </div>
  )
}
