'use client'

import { format } from 'date-fns'
import {
  bestDeepWorkDayLabel,
  formatMinutesAsHours,
  minutesDeepWorkForDate,
  minutesDeepWorkThisWeek,
  type DeepWorkSession,
} from '@/lib/deep-work-sessions'

type Props = {
  sessions: DeepWorkSession[]
  /** After cloud load: DB sum for today. `null` = not loaded yet (use session-derived minutes). */
  serverTodayMinutes?: number | null
}

export function DeepWorkStatsStrip({ sessions, serverTodayMinutes }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const fromSessions = minutesDeepWorkForDate(sessions, today)
  const todayMin = serverTodayMinutes != null ? serverTodayMinutes : fromSessions
  const weekMin = minutesDeepWorkThisWeek(sessions, new Date())
  const best = bestDeepWorkDayLabel(sessions)

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
      <span>Today: {formatMinutesAsHours(todayMin)} deep work</span>
      <span className="mx-2 hidden sm:inline">|</span>
      <span className="mt-1 block sm:mt-0 sm:inline">
        This week: {formatMinutesAsHours(weekMin)}
      </span>
      <span className="mx-2 hidden sm:inline">|</span>
      <span className="mt-1 block sm:mt-0 sm:inline">
        Best day: {best ?? '—'}
      </span>
    </div>
  )
}
