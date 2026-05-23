'use client'

import { useEffect, useState } from 'react'
import { DeepWorkStatsStrip } from '@/components/focus/deep-work-stats-strip'
import { UnifiedTimer } from '@/components/focus/UnifiedTimer'
import { HoverTooltip } from '@/components/ui/HoverTooltip'
import { TOOLTIP_FOCUS_DEEP_WORK } from '@/lib/tool-library-tooltips'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import { useTimerAlarmSettings } from '@/hooks/useTimerAlarmSettings'
import { listDeepWorkSessions, shouldSyncToCloud } from '@/lib/dataService'
import { fetchDeepWorkMinutesToday } from '@/lib/deep-work-minutes-today-db'
import {
  loadDeepWorkSessionsLocal,
  type DeepWorkSession,
} from '@/lib/deep-work-sessions'
import { supabase } from '@/lib/supabase'

export function FocusPageClient() {
  const ctx = useDataServiceContext()
  const { isLoading: planLoading } = usePlan()
  const [sessions, setSessions] = useState<DeepWorkSession[]>([])
  const [serverTodayMinutes, setServerTodayMinutes] = useState<number | null>(null)
  const alarm = useTimerAlarmSettings()

  useEffect(() => {
    if (planLoading) return
    if (shouldSyncToCloud(ctx)) {
      void listDeepWorkSessions(ctx).then(setSessions)
    } else {
      setSessions(loadDeepWorkSessionsLocal())
      setServerTodayMinutes(null)
    }
  }, [planLoading, ctx.userId, ctx.isPro])

  useEffect(() => {
    if (planLoading || !shouldSyncToCloud(ctx)) return
    void fetchDeepWorkMinutesToday(supabase).then(setServerTodayMinutes)
  }, [planLoading, ctx.userId, ctx.isPro, sessions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.location.hash.replace(/^#/, '')
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 pt-4 md:pt-2">
        <HoverTooltip text={TOOLTIP_FOCUS_DEEP_WORK}>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-none md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="min-w-0 flex-1">
                <div className="label-machine">Focus machine</div>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Focus Machine
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  One control surface for Pomodoro rounds and Pro deep-work sprints, with intent lock,
                  audio, and alerts grouped in the panel.
                </p>
                <nav
                  className="mt-5 flex flex-wrap gap-2"
                  aria-label="Focus sections"
                >
                  <a
                    href="#pomodoro-focus"
                    className="inline-flex items-center rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110"
                  >
                    Timer
                  </a>
                  <a
                    href="#deep-work"
                    className="inline-flex items-center rounded-full border border-border bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Deep work
                  </a>
                  <a
                    href="#focus-stats"
                    className="inline-flex items-center rounded-full border border-border bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Stats
                  </a>
                </nav>
              </div>
              <div className="lg:max-w-xs lg:shrink-0">
                <p className="label-machine mb-2 lg:text-right">Signal key</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground lg:text-right">
                  <li>
                    <span className="font-semibold text-primary">Gold</span> — primary actions & timer
                  </li>
                  <li>
                    <span className="font-semibold text-[#4CAF50]">Green</span> — success / on track
                  </li>
                  <li>
                    <span className="font-semibold text-[#EF4444]">Red</span> — stop / danger
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </HoverTooltip>

        <UnifiedTimer setSessions={setSessions} alarm={alarm} />
        <DeepWorkStatsStrip sessions={sessions} serverTodayMinutes={serverTodayMinutes} />
      </div>
    </div>
  )
}
