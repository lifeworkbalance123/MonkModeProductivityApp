import {
  addDays,
  format,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'
import type {
  DeepWorkDay,
  GoalCompletionDay,
  HabitCompletionDay,
  StreakHistoryDay,
} from '@/lib/analyticsService'

function seededNoise(seed: number, i: number) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function buildSampleHabitSeries(days: number): HabitCompletionDay[] {
  const end = new Date()
  const out: HabitCompletionDay[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(end, i)
    const key = format(d, 'yyyy-MM-dd')
    const base = 45 + seededNoise(1, i) * 45
    const completed = Math.round((base / 100) * 6)
    const total = 6
    const percentage = Math.round((completed / total) * 100)
    out.push({ date: key, completed, total, percentage })
  }
  return out
}

export function buildSampleGoalSeries(days: number): GoalCompletionDay[] {
  return buildSampleHabitSeries(days).map((r) => ({ ...r }))
}

export function buildSampleDeepWork14(): DeepWorkDay[] {
  const end = new Date()
  const out: DeepWorkDay[] = []
  for (let i = 13; i >= 0; i--) {
    const d = subDays(end, i)
    const key = format(d, 'yyyy-MM-dd')
    const minutes = Math.round(20 + seededNoise(2, i) * 120)
    out.push({ date: key, minutes, sessions: minutes > 0 ? 1 : 0 })
  }
  return out
}

export function buildSampleWeeklyBar(): { day: string; percentage: number }[] {
  return [
    { day: 'Mon', percentage: 72 },
    { day: 'Tue', percentage: 81 },
    { day: 'Wed', percentage: 87 },
    { day: 'Thu', percentage: 68 },
    { day: 'Fri', percentage: 76 },
    { day: 'Sat', percentage: 45 },
    { day: 'Sun', percentage: 34 },
  ]
}

export function buildSampleStreakSeries(days: number): StreakHistoryDay[] {
  const end = new Date()
  let streak = 3
  const out: StreakHistoryDay[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(end, i)
    const key = format(d, 'yyyy-MM-dd')
    if (seededNoise(3, i) > 0.88) streak = 0
    else streak = Math.min(40, streak + (seededNoise(4, i) > 0.5 ? 1 : 0))
    out.push({ date: key, streak })
  }
  return out
}

export function buildSampleHeatmapCells(): {
  date: string
  percentage: number
  completed: number
  total: number
}[] {
  const today = startOfDay(new Date())
  const anchorMonday = startOfWeek(subWeeks(today, 51), { weekStartsOn: 1 })
  const cells: {
    date: string
    percentage: number
    completed: number
    total: number
  }[] = []
  for (let col = 0; col < 52; col++) {
    for (let row = 0; row < 7; row++) {
      const d = addDays(anchorMonday, col * 7 + row)
      const key = format(d, 'yyyy-MM-dd')
      const idx = col * 7 + row
      if (d > today) {
        cells.push({ date: key, percentage: -1, completed: 0, total: 6 })
        continue
      }
      const pct = Math.round(seededNoise(5, idx) * 100)
      const completed = Math.round((pct / 100) * 6)
      cells.push({ date: key, percentage: pct, completed, total: 6 })
    }
  }
  return cells
}
