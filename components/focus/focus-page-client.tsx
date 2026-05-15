'use client'

import { useEffect, useState } from 'react'
import { DeepWorkModeCard } from '@/components/focus/deep-work-mode-card'
import { DeepWorkStatsStrip } from '@/components/focus/deep-work-stats-strip'
import { PomodoroTimerCard } from '@/components/focus/pomodoro-timer-card'
import { Card } from '@/components/ui/card'
import { HoverTooltip } from '@/components/ui/HoverTooltip'
import { TOOLTIP_FOCUS_DEEP_WORK } from '@/lib/tool-library-tooltips'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
                  High-contrast timers, deep-work sprints, and strip stats—built like a control panel,
                  not a wellness app.
                </p>
                <nav
                  className="mt-5 flex flex-wrap gap-2"
                  aria-label="Focus sections"
                >
                  <a
                    href="#pomodoro-focus"
                    className="inline-flex items-center rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110"
                  >
                    Pomodoro
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

        <Card className="rounded-2xl border border-border p-4 shadow-none md:p-5">
          <div className="label-machine mb-3">Timer alerts</div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
            <div className="flex items-center gap-2">
              <Switch
                id="timer-alarm-sound"
                checked={alarm.soundOn}
                onCheckedChange={alarm.setSoundOn}
              />
              <Label htmlFor="timer-alarm-sound" className="cursor-pointer font-normal">
                Sound when a phase ends
              </Label>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="timer-alarm-notify"
                  checked={alarm.notifyOn}
                  onCheckedChange={alarm.setNotifyOn}
                  disabled={alarm.notifyPermission === 'unsupported'}
                />
                <Label htmlFor="timer-alarm-notify" className="cursor-pointer font-normal">
                  Desktop notification
                </Label>
              </div>
              {alarm.notifyPermission === 'denied' ? (
                <p className="text-xs text-muted-foreground sm:ml-0">
                  Unblock notifications for this site in your browser settings to use alerts in the background.
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <PomodoroTimerCard alarmSoundRef={alarm.soundRef} alarmNotifyRef={alarm.notifyRef} />
        <DeepWorkModeCard
          setSessions={setSessions}
          alarmSoundRef={alarm.soundRef}
          alarmNotifyRef={alarm.notifyRef}
        />
        <DeepWorkStatsStrip sessions={sessions} serverTodayMinutes={serverTodayMinutes} />
      </div>
    </div>
  )
}
