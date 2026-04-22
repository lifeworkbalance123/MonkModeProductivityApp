'use client'

import { useEffect, useState } from 'react'
import { DeepWorkModeCard } from '@/components/focus/deep-work-mode-card'
import { DeepWorkStatsStrip } from '@/components/focus/deep-work-stats-strip'
import { PomodoroTimerCard } from '@/components/focus/pomodoro-timer-card'
import { Card } from '@/components/ui/card'
import { HoverTooltip } from '@/components/ui/HoverTooltip'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import { useTimerAlarmSettings } from '@/hooks/useTimerAlarmSettings'
import { listDeepWorkSessions, shouldSyncToCloud } from '@/lib/dataService'
import {
  loadDeepWorkSessionsLocal,
  type DeepWorkSession,
} from '@/lib/deep-work-sessions'

export function FocusPageClient() {
  const ctx = useDataServiceContext()
  const { isLoading: planLoading } = usePlan()
  const [sessions, setSessions] = useState<DeepWorkSession[]>([])
  const alarm = useTimerAlarmSettings()

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
      <div className="mx-auto max-w-xl space-y-8 px-4 py-8 pt-4 md:pt-2">
        <HoverTooltip text="Start a Pomodoro (25 min) or a deep work block (50\u201190 min). No phone. No interruptions. Just focus.">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Focus & Deep Work
            </h1>
            <p className="text-sm text-muted-foreground">
              Pomodoro at the top; Deep Work Mode (90-minute sprints) below—scroll
              after the timer.
            </p>
          </div>
        </HoverTooltip>

        <Card className="border-border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Timer alerts</p>
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
        <DeepWorkStatsStrip sessions={sessions} />
      </div>
    </div>
  )
}
