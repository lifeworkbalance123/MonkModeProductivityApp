'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { DeepWorkModeCard } from '@/components/focus/deep-work-mode-card'
import { DeepWorkStatsStrip } from '@/components/focus/deep-work-stats-strip'
import { PomodoroTimerCard } from '@/components/focus/pomodoro-timer-card'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import { listDeepWorkSessions, shouldSyncToCloud } from '@/lib/dataService'
import {
  loadDeepWorkSessionsLocal,
  type DeepWorkSession,
} from '@/lib/deep-work-sessions'

export function FocusPageClient() {
  const ctx = useDataServiceContext()
  const { isLoading: planLoading } = usePlan()
  const [sessions, setSessions] = useState<DeepWorkSession[]>([])

  useEffect(() => {
    if (planLoading) return
    if (shouldSyncToCloud(ctx)) {
      void listDeepWorkSessions(ctx).then(setSessions)
    } else {
      setSessions(loadDeepWorkSessionsLocal())
    }
  }, [planLoading, ctx.userId, ctx.isPro])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#deep-work') return
    const el = document.getElementById('deep-work')
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-xl space-y-8 px-4 py-8 pt-24">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Focus & Deep Work
          </h1>
          <p className="text-sm text-muted-foreground">
            Pomodoro at the top; Deep Work Mode (90-minute sprints) below—scroll
            after the timer.
          </p>
        </div>
        <PomodoroTimerCard />
        <DeepWorkModeCard setSessions={setSessions} />
        <DeepWorkStatsStrip sessions={sessions} />
      </div>
    </div>
  )
}
