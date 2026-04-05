import type { HabitLog } from '@/lib/monk-types'
import { format, subDays } from 'date-fns'

/** Consecutive days (ending today) where at least one habit was completed. */
export function computeStreak(habitLog: HabitLog): number {
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = subDays(new Date(), i)
    const key = format(d, 'yyyy-MM-dd')
    const anyDone = Object.values(habitLog).some((m) => m[key] === true)
    if (!anyDone) break
    streak++
  }
  return streak
}

/** Share of last 7 days (including today) this habit was completed, 0–100. */
export function habitWeekProgress(habitLog: HabitLog, habitId: string): number {
  let done = 0
  for (let i = 0; i < 7; i++) {
    const key = format(subDays(new Date(), i), 'yyyy-MM-dd')
    if (habitLog[habitId]?.[key]) done++
  }
  return Math.round((done / 7) * 100)
}
