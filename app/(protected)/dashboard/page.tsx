'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { DashboardApp } from '@/components/dashboard-app'
import { ProgramCards } from '@/components/dashboard/ProgramCards'
import { TodayChecklist } from '@/components/dashboard/TodayChecklist'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useMonkData } from '@/hooks/use-monk-data'
import { useProgramStatus } from '@/hooks/useProgramStatus'
import { useTrialBanner } from '@/hooks/use-trial-banner'
import { useAuth } from '@/context/AuthContext'
import { captureEvent } from '@/lib/analytics'

export default function DashboardPage() {
  const { data, setData, ready, dataContext, loadError, reload } = useMonkData()
  const { activeProgram, programs, loading: statusLoading } = useProgramStatus()
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
      {loadError ? (
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 md:pt-2">
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
        <div className="dashboard-container space-y-6">
          {!statusLoading ? (
            activeProgram ? (
              <div className="programs-section mx-auto w-full max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
                <div className="dashboard-header">
                  <TodayChecklist programType={activeProgram.program_type} />
                </div>
                <div className="dashboard-header mt-2">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    Other Programs
                  </h2>
                  <ProgramCards />
                </div>
              </div>
            ) : programs.length > 0 ? (
              <div className="programs-section mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                <ProgramCards />
              </div>
            ) : null
          ) : null}
          <div className="dashboard-content">
            <DashboardApp
              data={data}
              onChange={setData}
              dataContext={dataContext}
              userId={user?.id}
            />
          </div>
        </div>
      )}
    </div>
  )
}
