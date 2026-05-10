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
    <div
      id="focus-stats"
      className="scroll-mt-24 grid gap-3 sm:grid-cols-3 md:scroll-mt-28"
    >
      <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-primary/45 bg-card px-4 py-5 text-center shadow-none">
        <span className="label-machine">Today</span>
        <span className="text-3xl font-bold tabular-nums tracking-tight text-primary sm:text-4xl">
          {formatMinutesAsHours(todayMin)}
        </span>
        <span className="text-[11px] text-muted-foreground">deep work</span>
      </div>
      <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-border bg-card px-4 py-5 text-center shadow-none">
        <span className="label-machine">This week</span>
        <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
          {formatMinutesAsHours(weekMin)}
        </span>
        <span className="text-[11px] text-muted-foreground">total focus</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#4CAF50]/40 bg-card px-4 py-5 text-center shadow-none">
        <span className="label-machine">Best day</span>
        <span className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {best ?? '—'}
        </span>
        <span className="text-[11px] text-[#4CAF50]">peak session</span>
      </div>
    </div>
  )
}
