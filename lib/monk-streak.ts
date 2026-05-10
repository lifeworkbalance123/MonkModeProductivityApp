import type { HabitLog } from '@/lib/monk-types'
import { addDays, format, subDays } from 'date-fns'

/** Mon=index 0 … Sun=6 for the given week (weekStartsOn Monday). */
export function habitWeekDayCompletion(
  habitLog: HabitLog,
  habitId: string,
  weekStartMonday: Date,
): boolean[] {
  return Array.from({ length: 7 }, (_, i) => {
    const key = format(addDays(weekStartMonday, i), 'yyyy-MM-dd')
    return !!habitLog[habitId]?.[key]
  })
}

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
