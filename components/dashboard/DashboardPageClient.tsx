'use client'

import { memo, useEffect, useMemo } from 'react'
import { DashboardApp } from '@/components/dashboard-app'
import { ProgramCards } from '@/components/dashboard/ProgramCards'
import { TodayChecklist } from '@/components/dashboard/TodayChecklist'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useMonkData } from '@/hooks/use-monk-data'
import { useProgramStatus } from '@/hooks/useProgramStatus'
import { useTrialBanner } from '@/hooks/use-trial-banner'
import { useAuth } from '@/context/AuthContext'
import { captureEvent } from '@/lib/analytics'
import type { ProgramType } from '@/lib/programStatus'

export interface DashboardPageClientProps {
  welcomeName?: string
  serverActiveProgramType?: ProgramType | null
  userId?: string
}

type DashboardContentProps = {
  welcomeName: string
  serverActiveProgramType: ProgramType | null
}

const DashboardContent = memo(function DashboardContent({
  welcomeName,
  serverActiveProgramType,
}: DashboardContentProps) {
  return (
    <div className="container mx-auto px-4 py-3">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Welcome back, {welcomeName}
        </p>
      </div>

      {serverActiveProgramType ? (
        <div className="space-y-4">
          <TodayChecklist programType={serverActiveProgramType} />
          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Other Programs
            </h2>
            <ProgramCards hideActiveProgramSummary />
          </div>
        </div>
      ) : (
        <ProgramCards />
      )}
    </div>
  )
})

export function DashboardPageClient({
  welcomeName,
  serverActiveProgramType,
  userId,
}: DashboardPageClientProps) {
  const { data, setData, ready, dataContext, loadError, reload } = useMonkData()
  const { activeProgram } = useProgramStatus()
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

  const effectiveUserId = useMemo(() => user?.id ?? userId, [user?.id, userId])
  const effectiveWelcomeName = useMemo(
    () => welcomeName ?? user?.email?.split('@')[0] ?? '',
    [welcomeName, user?.email],
  )
  const effectiveProgramType = useMemo<ProgramType | null>(
    () => serverActiveProgramType ?? activeProgram?.program_type ?? null,
    [serverActiveProgramType, activeProgram?.program_type],
  )

  return (
    <div className="min-h-screen bg-background">
      {loadError ? (
        <div className="mx-auto max-w-7xl px-4 pb-2 pt-4 md:pt-2">
          <ErrorBanner message={loadError} onRetry={() => void reload()} />
        </div>
      ) : null}
      {!ready ? (
        <div className="dashboard-skeleton mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        <div className="dashboard-container space-y-6">
          <DashboardContent
            welcomeName={effectiveWelcomeName}
            serverActiveProgramType={effectiveProgramType}
          />

          <div className="dashboard-content">
            <DashboardApp
              data={data}
              onChange={setData}
              dataContext={dataContext}
              userId={effectiveUserId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
