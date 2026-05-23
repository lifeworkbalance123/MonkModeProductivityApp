'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
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
import { withAuthStorageLockRetry } from '@/lib/authStorageLock'
import { ClearAllDataButton } from '@/components/schedule/ClearAllDataButton'
import { QuickStartCard } from '@/components/QuickStartCard'
import { Tooltip } from '@/components/ui/first-visit-tooltip'
import { TOOLTIP_DASHBOARD_FIRST_VISIT } from '@/lib/tool-library-tooltips'

export interface DashboardPageClientProps {
  welcomeName?: string
  serverActiveProgramType?: ProgramType | null
  userId?: string
}

type DashboardContentProps = {
  welcomeName: string
  serverActiveProgramType: ProgramType | null
  headerActions?: React.ReactNode
  showOnboardingTip?: boolean
}

const DashboardContent = memo(function DashboardContent({
  welcomeName,
  serverActiveProgramType,
  headerActions,
  showOnboardingTip,
}: DashboardContentProps) {
  const greeting = (
    <div className="greeting-section mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
  )

  return (
    <div className="container mx-auto p-6">
      {showOnboardingTip ? (
        <Tooltip id="tooltip_dashboard_no_program" text={TOOLTIP_DASHBOARD_FIRST_VISIT}>
          {greeting}
        </Tooltip>
      ) : (
        greeting
      )}

      <CollapsibleSection title="Today & programs">
        {serverActiveProgramType ? (
          <div className="space-y-4">
            <TodayChecklist programType={serverActiveProgramType} />
            <CollapsibleTimeBlock
              time="More"
              title="Other programs"
              subtitle="Switch or start another track"
              storageKey="dashboard:block:other-programs"
              defaultExpanded={false}
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
  const { data, setData, ready, dataContext, loadError, reload, flush } = useMonkData()
  const [scheduleReloadTick, setScheduleReloadTick] = useState(0)
  const { activeProgram, loading: programStatusLoading } = useProgramStatus()
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

  const showDashboardOnboarding =
    !programStatusLoading && effectiveProgramType == null

  const clearScheduleData = useCallback(async () => {
    const {
      data: { session },
    } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
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
        <div className="dashboard-container mobile-friendly flex flex-col gap-5">
          {effectiveUserId ? (
            <div className="container mx-auto px-6 pt-6">
              <QuickStartCard
                userId={effectiveUserId}
                userCreatedAt={user?.created_at}
                programType={effectiveProgramType}
                currentProgramDay={activeProgram?.currentDay ?? null}
                habitsCount={data.habits.length}
                goalsCount={data.goals.length}
                timeSlotsCount={data.timeSlots.length}
              />
            </div>
          ) : null}
          <DashboardContent
            welcomeName={effectiveWelcomeName}
            serverActiveProgramType={effectiveProgramType}
            showOnboardingTip={showDashboardOnboarding}
            headerActions={
              <ClearAllDataButton
                hasData={data.timeSlots.length > 0}
                onClear={async () => {
                  // Prevent any pending autosave from re-writing cleared slots.
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('monk:schedule:cleared'))
                  }
                  await clearScheduleData()
                  try {
                    localStorage.removeItem('monk-dashboard-day-v1')
                  } catch {
                    /* ignore */
                  }
                  // Commit before flush() so useMonkData's dataRef sees cleared slots;
                  // otherwise persistFullMonkData can re-upsert the old weekly template.
                  flushSync(() => {
                    setData((d) => ({ ...d, timeSlots: [] }))
                  })
                  const persist = await flush()
                  if (!persist.ok && persist.error) {
                    throw new Error(persist.error)
                  }
                  setScheduleReloadTick((n) => n + 1)
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
              scheduleReloadTick={scheduleReloadTick}
              programDay={activeProgram?.currentDay ?? null}
            />
          </div>
        </div>
      )}
    </div>
  )
}
