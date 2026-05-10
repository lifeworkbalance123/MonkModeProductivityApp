/**
 * Analytics aggregates: Pro reads from synced Monk data + Supabase where needed;
 * Free uses local Monk data and localStorage deep work sessions.
 */

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import { computeStreak } from '@/lib/monk-streak'
import type { HabitLog, MonkData } from '@/lib/monk-types'
import type { DeepWorkSession } from '@/lib/deep-work-sessions'
import {
  listDeepWorkSessions,
  shouldSyncToCloud,
  type DataServiceContext,
} from '@/lib/dataService'
import { filterGoalsWithNonEmptyText } from '@/lib/goals-utils'
import { readGoalDailySnapshots } from '@/lib/goal-daily-snapshots'

export type HabitCompletionDay = {
  date: string
  completed: number
  total: number
  percentage: number
}

export type GoalCompletionDay = {
  date: string
  completed: number
  total: number
  percentage: number
}

export type DeepWorkDay = {
  date: string
  minutes: number
  sessions: number
}

export type StreakHistoryDay = {
  date: string
  streak: number
}

export type CurrentStats = {
  currentStreak: number
  bestStreak: number
  habitsCompletedThisWeek: number
  habitsTotalThisWeek: number
  goalsHitThisMonth: number
  goalsTotalThisMonth: number
  deepWorkHoursThisWeek: number
  deepWorkHoursLastWeek: number
  mostConsistentHabit: string
  leastConsistentHabit: string
  bestDayOfWeek: string
  worstDayOfWeek: string
}

/** UI period selector + optional 365 for service callers. */
export type AnalyticsPeriod = 7 | 30 | 90 | 365 | 'all'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ctxFromUser(userId: string | null, isPro: boolean): DataServiceContext {
  return { userId, isPro }
}

function allDatesInLog(log: HabitLog): string[] {
  const s = new Set<string>()
  for (const m of Object.values(log)) {
    for (const [d, v] of Object.entries(m)) {
      if (v) s.add(d)
    }
  }
  return [...s].sort()
}

function earliestLogDate(log: HabitLog): Date | null {
  const dates = allDatesInLog(log)
  if (!dates.length) return null
  return parseISO(dates[0]!)
}

function windowBounds(
  days: AnalyticsPeriod,
  habitLog: HabitLog,
): { start: Date; end: Date } {
  const end = startOfDay(new Date())
  if (days === 'all') {
    const first = earliestLogDate(habitLog)
    const start = first
      ? startOfDay(first)
      : startOfDay(subDays(end, 365))
    return { start, end }
  }
  return { start: startOfDay(subDays(end, days - 1)), end }
}

function habitDayStats(
  monk: MonkData,
  dateKey: string,
): { completed: number; total: number; percentage: number } {
  const n = monk.habits.length
  if (n === 0) return { completed: 0, total: 0, percentage: 0 }
  let c = 0
  for (const h of monk.habits) {
    if (monk.habitLog[h.id]?.[dateKey]) c++
  }
  return {
    completed: c,
    total: n,
    percentage: Math.round((c / n) * 100),
  }
}

/** Per-day habit completion for charts and heatmap. */
export function getHabitCompletionData(
  userId: string | null,
  isPro: boolean,
  days: AnalyticsPeriod,
  monk: MonkData,
): HabitCompletionDay[] {
  void userId
  void isPro
  const { start, end } = windowBounds(days, monk.habitLog)
  const out: HabitCompletionDay[] = []
  for (const d of eachDayOfInterval({ start, end })) {
    const key = format(d, 'yyyy-MM-dd')
    const { completed, total, percentage } = habitDayStats(monk, key)
    out.push({ date: key, completed, total, percentage })
  }
  return out
}

/**
 * Goal completion time series. Daily goals are not stored with per-day history in the app;
 * this series matches habit completion % so the trend reflects daily discipline (same shape as habits).
 */
export function getGoalCompletionData(
  userId: string | null,
  isPro: boolean,
  days: AnalyticsPeriod,
  monk: MonkData,
): GoalCompletionDay[] {
  void userId
  void isPro
  const { start, end } = windowBounds(days, monk.habitLog)
  const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd')
  const snaps = readGoalDailySnapshots()
  const goalsWithText = filterGoalsWithNonEmptyText(monk.goals)
  const gt = goalsWithText.length
  const out: GoalCompletionDay[] = []

  for (const d of eachDayOfInterval({ start, end })) {
    const key = format(d, 'yyyy-MM-dd')
    const snap = snaps[key]
    if (snap && snap.total > 0) {
      const pct = Math.min(100, Math.round((snap.completed / snap.total) * 100))
      out.push({
        date: key,
        completed: snap.completed,
        total: snap.total,
        percentage: pct,
      })
      continue
    }
    if (key === todayKey && gt > 0) {
      const completed = goalsWithText.filter((g) => g.completed).length
      out.push({
        date: key,
        completed,
        total: gt,
        percentage: Math.round((completed / gt) * 100),
      })
      continue
    }
    if (gt > 0) {
      const h = habitDayStats(monk, key)
      const completed = Math.min(gt, Math.round((h.percentage / 100) * gt))
      out.push({
        date: key,
        completed,
        total: gt,
        percentage: Math.round((completed / gt) * 100),
      })
    } else {
      const h = habitDayStats(monk, key)
      out.push({
        date: key,
        completed: h.completed,
        total: h.total,
        percentage: h.percentage,
      })
    }
  }
  return out
}

export function getDeepWorkData(
  userId: string | null,
  isPro: boolean,
  days: 7 | 14 | 30,
  sessions: DeepWorkSession[],
): DeepWorkDay[] {
  void userId
  void isPro
  const end = startOfDay(new Date())
  const start = startOfDay(subDays(end, days - 1))
  const byDate = new Map<string, { minutes: number; sessions: number }>()
  for (const s of sessions) {
    if (!s.date) continue
    const day = s.date.slice(0, 10)
    const cur = byDate.get(day) ?? { minutes: 0, sessions: 0 }
    cur.minutes += s.duration_minutes
    cur.sessions += 1
    byDate.set(day, cur)
  }
  const out: DeepWorkDay[] = []
  for (const d of eachDayOfInterval({ start, end })) {
    const key = format(d, 'yyyy-MM-dd')
    const row = byDate.get(key) ?? { minutes: 0, sessions: 0 }
    out.push({ date: key, minutes: row.minutes, sessions: row.sessions })
  }
  return out
}

function streakEndingOnDate(log: HabitLog, asOf: Date): number {
  let streak = 0
  for (let i = 0; i < 800; i++) {
    const d = subDays(asOf, i)
    const key = format(d, 'yyyy-MM-dd')
    const anyDone = Object.values(log).some((m) => m[key] === true)
    if (!anyDone) break
    streak++
  }
  return streak
}

export function getStreakHistory(
  userId: string | null,
  isPro: boolean,
  days: AnalyticsPeriod,
  monk: MonkData,
): StreakHistoryDay[] {
  void userId
  void isPro
  const { start, end } = windowBounds(days, monk.habitLog)
  const out: StreakHistoryDay[] = []
  for (const d of eachDayOfInterval({ start, end })) {
    const key = format(d, 'yyyy-MM-dd')
    out.push({
      date: key,
      streak: streakEndingOnDate(monk.habitLog, d),
    })
  }
  return out
}

function computeBestStreakFromLog(log: HabitLog): number {
  const dates = new Set<string>()
  for (const m of Object.values(log)) {
    for (const [d, v] of Object.entries(m)) {
      if (v) dates.add(d)
    }
  }
  if (dates.size === 0) return 0
  const sorted = [...dates].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const ds of sorted) {
    const cur = parseISO(ds)
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000
      if (diff === 1) run++
      else run = 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    prev = cur
  }
  return best
}

function habitsCompletedInRange(monk: MonkData, start: Date, end: Date): number {
  let sum = 0
  for (const d of eachDayOfInterval({ start, end })) {
    const key = format(d, 'yyyy-MM-dd')
    sum += habitDayStats(monk, key).completed
  }
  return sum
}

function deepWorkMinutesInRange(
  sessions: DeepWorkSession[],
  start: Date,
  end: Date,
): number {
  let m = 0
  for (const s of sessions) {
    if (!s.date) continue
    const t = parseISO(s.date.slice(0, 10))
    if (t >= start && t <= end) m += s.duration_minutes
  }
  return m
}

function habitRatesInWindow(
  monk: MonkData,
  start: Date,
  end: Date,
): { id: string; name: string; rate: number }[] {
  if (monk.habits.length === 0) return []
  const days = eachDayOfInterval({ start, end }).length || 1
  return monk.habits.map((h) => {
    let done = 0
    for (const d of eachDayOfInterval({ start, end })) {
      const key = format(d, 'yyyy-MM-dd')
      if (monk.habitLog[h.id]?.[key]) done++
    }
    return { id: h.id, name: h.name, rate: done / days }
  })
}

function bestWorstWeekday(monk: MonkData): { best: string; worst: string } {
  const n = monk.habits.length
  if (n === 0) return { best: '', worst: '' }
  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of eachDayOfInterval({
    start: subDays(new Date(), 365),
    end: new Date(),
  })) {
    const key = format(d, 'yyyy-MM-dd')
    const wd = getDay(d)
    sums[wd] += habitDayStats(monk, key).percentage
    counts[wd]++
  }
  let bestI = 0
  let worstI = 0
  let bestAvg = -1
  let worstAvg = 999
  for (let i = 0; i < 7; i++) {
    if (counts[i] === 0) continue
    const avg = sums[i]! / counts[i]!
    if (avg > bestAvg) {
      bestAvg = avg
      bestI = i
    }
    if (avg < worstAvg) {
      worstAvg = avg
      worstI = i
    }
  }
  return {
    best: WEEKDAY_LABELS[bestI] ?? '',
    worst: WEEKDAY_LABELS[worstI] ?? '',
  }
}

export async function getCurrentStats(
  userId: string | null,
  isPro: boolean,
  monk: MonkData,
  sessions: DeepWorkSession[],
): Promise<CurrentStats> {
  const ctx = ctxFromUser(userId, isPro)
  const currentStreak = computeStreak(monk.habitLog)
  let bestStreak = computeBestStreakFromLog(monk.habitLog)

  if (shouldSyncToCloud(ctx) && userId) {
    const { data } = await supabase
      .from('streaks')
      .select('best_streak')
      .eq('user_id', userId)
      .maybeSingle()
    const cloudBest = (data as { best_streak?: number } | null)?.best_streak
    if (typeof cloudBest === 'number' && cloudBest > bestStreak) {
      bestStreak = cloudBest
    }
  }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)
  const prevWeekStart = subWeeks(weekStart, 1)
  const prevWeekEnd = subDays(weekStart, 1)

  const habitsCompletedThisWeek = habitsCompletedInRange(monk, weekStart, weekEnd)
  const habitsTotalThisWeek = monk.habits.length * 7

  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const goalsWithTextAll = filterGoalsWithNonEmptyText(monk.goals)
  const goalsHitThisMonth = goalsWithTextAll.filter((g) => g.completed).length
  const goalsTotalThisMonth = goalsWithTextAll.length

  void monthStart
  void monthEnd

  const dwThis = deepWorkMinutesInRange(sessions, weekStart, weekEnd)
  const dwLast = deepWorkMinutesInRange(sessions, prevWeekStart, prevWeekEnd)

  const rates = habitRatesInWindow(monk, subDays(now, 30), now)
  const sorted = [...rates].sort((a, b) => b.rate - a.rate)
  const mostConsistentHabit = sorted[0]?.name ?? ''
  const leastConsistentHabit = sorted[sorted.length - 1]?.name ?? ''
  const { best, worst } = bestWorstWeekday(monk)

  return {
    currentStreak,
    bestStreak,
    habitsCompletedThisWeek,
    habitsTotalThisWeek,
    goalsHitThisMonth,
    goalsTotalThisMonth,
    deepWorkHoursThisWeek: dwThis / 60,
    deepWorkHoursLastWeek: dwLast / 60,
    mostConsistentHabit,
    leastConsistentHabit,
    bestDayOfWeek: best,
    worstDayOfWeek: worst,
  }
}

/** Load deep work sessions (cloud or localStorage). */
export async function fetchAnalyticsSessions(
  ctx: DataServiceContext,
): Promise<DeepWorkSession[]> {
  return listDeepWorkSessions(ctx)
}

/** Weekly habit % by weekday for bar chart (uses dates in window). */
export function getWeeklyHabitBarData(
  monk: MonkData,
  days: AnalyticsPeriod,
): { day: string; percentage: number }[] {
  const { start, end } = windowBounds(days, monk.habitLog)
  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of eachDayOfInterval({ start, end })) {
    const wd = getDay(d)
    const key = format(d, 'yyyy-MM-dd')
    sums[wd] += habitDayStats(monk, key).percentage
    counts[wd]++
  }
  const order = [1, 2, 3, 4, 5, 6, 0]
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return order.map((wd, i) => ({
    day: labels[i]!,
    percentage:
      counts[wd]! > 0 ? Math.round(sums[wd]! / counts[wd]!) : 0,
  }))
}

export function weeklyHabitBarAverage(rows: { percentage: number }[]): number {
  if (!rows.length) return 0
  return Math.round(
    rows.reduce((a, r) => a + r.percentage, 0) / rows.length,
  )
}

export function bestWorstWeekdayFromBarData(
  rows: { day: string; percentage: number }[],
): { best: string; worst: string } {
  if (!rows.length) return { best: '', worst: '' }
  const sorted = [...rows].sort((a, b) => b.percentage - a.percentage)
  return { best: sorted[0]!.day, worst: sorted[sorted.length - 1]!.day }
}

/** Heatmap: ~52 weeks × 7 days from habit log; cell = completion % that day. */
export function getHeatmapDayCells(monk: MonkData): {
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
      if (d > today) {
        cells.push({
          date: format(d, 'yyyy-MM-dd'),
          percentage: -1,
          completed: 0,
          total: monk.habits.length,
        })
        continue
      }
      const key = format(d, 'yyyy-MM-dd')
      const st = habitDayStats(monk, key)
      cells.push({
        date: key,
        percentage: st.percentage,
        completed: st.completed,
        total: st.total,
      })
    }
  }
  return cells
}

export function heatmapHabitConsistency(monk: MonkData): {
  most: { name: string; pct: number }
  least: { name: string; pct: number }
} {
  const { start, end } = windowBounds(365, monk.habitLog)
  const days = eachDayOfInterval({ start, end }).length || 1
  if (monk.habits.length === 0) {
    return {
      most: { name: '—', pct: 0 },
      least: { name: '—', pct: 0 },
    }
  }
  const rates = monk.habits.map((h) => {
    let done = 0
    for (const d of eachDayOfInterval({ start, end })) {
      const key = format(d, 'yyyy-MM-dd')
      if (monk.habitLog[h.id]?.[key]) done++
    }
    return { name: h.name, pct: Math.round((done / days) * 100) }
  })
  const sorted = [...rates].sort((a, b) => b.pct - a.pct)
  return {
    most: sorted[0] ?? { name: '—', pct: 0 },
    least: sorted[sorted.length - 1] ?? { name: '—', pct: 0 },
  }
}

export function streakLongestSegment(monk: MonkData): {
  longest: number
  started: string | null
} {
  const dates = new Set<string>()
  for (const m of Object.values(monk.habitLog)) {
    for (const [d, v] of Object.entries(m)) {
      if (v) dates.add(d)
    }
  }
  if (!dates.size) return { longest: 0, started: null }
  const sorted = [...dates].sort()
  let bestLen = 0
  let bestStart: string | null = null
  let runLen = 0
  let runStart: string | null = null
  let prev: Date | null = null
  for (const ds of sorted) {
    const cur = parseISO(ds)
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000
      if (diff === 1) {
        runLen++
      } else {
        runLen = 1
        runStart = ds
      }
    } else {
      runLen = 1
      runStart = ds
    }
    if (runLen > bestLen) {
      bestLen = runLen
      bestStart = runStart
    }
    prev = cur
  }
  return { longest: bestLen, started: bestStart }
}

export function currentStreakStartedDate(monk: MonkData): string | null {
  const s = computeStreak(monk.habitLog)
  if (s === 0) return null
  const end = new Date()
  const start = subDays(end, s - 1)
  return format(start, 'yyyy-MM-dd')
}

export const DEEP_WORK_WEEKLY_TARGET_LS_KEY =
  'monk_analytics_dw_weekly_target_hours'

export function getDeepWorkWeeklyTargetHours(): number {
  if (typeof window === 'undefined') return 20
  const raw = localStorage.getItem(DEEP_WORK_WEEKLY_TARGET_LS_KEY)
  const n = raw ? Number(raw) : 20
  if (!Number.isFinite(n) || n < 1) return 20
  return Math.min(168, Math.round(n))
}

export function setDeepWorkWeeklyTargetHours(hours: number) {
  if (typeof window === 'undefined') return
  const n = Math.min(168, Math.max(1, Math.round(hours)))
  localStorage.setItem(DEEP_WORK_WEEKLY_TARGET_LS_KEY, String(n))
}

export function bestDeepWorkDayInSessions(
  sessions: DeepWorkSession[],
): { hours: number; date: string } | null {
  const by = new Map<string, number>()
  for (const s of sessions) {
    if (!s.date) continue
    const d = s.date.slice(0, 10)
    by.set(d, (by.get(d) ?? 0) + s.duration_minutes)
  }
  let bestDate: string | null = null
  let bestMin = 0
  for (const [d, m] of by) {
    if (m > bestMin) {
      bestMin = m
      bestDate = d
    }
  }
  if (!bestDate) return null
  return { hours: bestMin / 60, date: bestDate }
}
