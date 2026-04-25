'use client'

import { memo, useCallback, useEffect, useMemo } from 'react'
import { DashboardApp } from '@/components/dashboard-app'
import { ProgramCards } from '@/components/dashboard/ProgramCards'
import { TodayChecklist } from '@/components/dashboard/TodayChecklist'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { CollapsibleTimeBlock } from '@/components/ui/CollapsibleTimeBlock'
import { ExpandAllButton } from '@/components/ui/ExpandAllButton'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useMonkData } from '@/hooks/use-monk-data'
import { useProgramStatus } from '@/hooks/useProgramStatus'
import { useTrialBanner } from '@/hooks/use-trial-banner'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { captureEvent } from '@/lib/analytics'
import type { ProgramType } from '@/lib/programStatus'
import { supabase } from '@/lib/supabase'
import { ClearAllDataButton } from '@/components/schedule/ClearAllDataButton'

export interface DashboardPageClientProps {
  welcomeName?: string
  serverActiveProgramType?: ProgramType | null
  userId?: string
}

type DashboardContentProps = {
  welcomeName: string
  serverActiveProgramType: ProgramType | null
  headerActions?: React.ReactNode
}

const DashboardContent = memo(function DashboardContent({
  welcomeName,
  serverActiveProgramType,
  headerActions,
}: DashboardContentProps) {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {welcomeName}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {headerActions}
          <ExpandAllButton className="shrink-0" />
        </div>
      </div>

      <CollapsibleSection
        title="Today & programs"
        storageKey="dashboard:section:today"
        defaultExpanded
      >
        {serverActiveProgramType ? (
          <div className="space-y-4">
            <TodayChecklist programType={serverActiveProgramType} />
            <CollapsibleTimeBlock
              time="More"
              title="Other programs"
              subtitle="Switch or start another track"
              storageKey="dashboard:block:other-programs"
              defaultExpanded
            >
              <ProgramCards hideActiveProgramSummary />
            </CollapsibleTimeBlock>
          </div>
        ) : (
          <ProgramCards />
        )}
      </CollapsibleSection>
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
  const { showToast } = useToast()

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

  const clearScheduleData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token

    const res = await fetch('/api/schedule/clear', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      throw new Error(payload.error ?? `Clear failed (${res.status})`)
    }
  }, [])

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
        <div className="dashboard-container flex flex-col gap-5">
          <DashboardContent
            welcomeName={effectiveWelcomeName}
            serverActiveProgramType={effectiveProgramType}
            headerActions={
              <ClearAllDataButton
                hasData={data.timeSlots.length > 0}
                onClear={async () => {
                  await clearScheduleData()
                  try {
                    localStorage.removeItem('monk-dashboard-day-v1')
                  } catch {
                    /* ignore */
                  }
                  setData((d) => ({ ...d, timeSlots: [] }))
                  showToast('Cleared schedule data.', 'success')
                }}
              />
            }
          />

          <div className="dashboard-content container mx-auto p-6 pt-0">
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
