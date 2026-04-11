import { format } from 'date-fns'
import type { Goal } from '@/lib/monk-types'

export const GOAL_DAILY_SNAPSHOT_LS_KEY = 'monk_goal_daily_completion_v1'

export type GoalDaySnapshot = { completed: number; total: number }

function parseSnaps(raw: string | null): Record<string, GoalDaySnapshot> {
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object') return {}
    const out: Record<string, GoalDaySnapshot> = {}
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue
      const r = v as Record<string, unknown>
      const completed = Number(r.completed)
      const total = Number(r.total)
      if (
        Number.isFinite(completed) &&
        Number.isFinite(total) &&
        total > 0
      ) {
        out[k] = {
          completed: Math.max(0, Math.min(total, Math.round(completed))),
          total: Math.round(total),
        }
      }
    }
    return out
  } catch {
    return {}
  }
}

export function readGoalDailySnapshots(): Record<string, GoalDaySnapshot> {
  if (typeof window === 'undefined') return {}
  return parseSnaps(localStorage.getItem(GOAL_DAILY_SNAPSHOT_LS_KEY))
}

/** Persist today's completed/total goal counts for analytics trends. */
export function recordTodayGoalSnapshot(goals: Goal[]) {
  if (typeof window === 'undefined') return
  const today = format(new Date(), 'yyyy-MM-dd')
  const total = goals.length
  const completed = goals.filter((g) => g.completed).length
  const map = readGoalDailySnapshots()
  if (total === 0) {
    delete map[today]
  } else {
    map[today] = { completed, total }
  }
  const keys = Object.keys(map).sort()
  if (keys.length > 800) {
    for (const k of keys.slice(0, keys.length - 800)) {
      delete map[k]
    }
  }
  try {
    localStorage.setItem(GOAL_DAILY_SNAPSHOT_LS_KEY, JSON.stringify(map))
  } catch {
    /* storage quota */
  }
}
