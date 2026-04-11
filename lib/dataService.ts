/**
 * Client-side data layer: Pro + logged-in users sync to Supabase; Free or anonymous use localStorage.
 * Must only be imported from client components/hooks.
 */

import { addDays, format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { computeStreak } from '@/lib/monk-streak'
import type { Goal, Habit, HabitLog, MonkData, TimeSlot } from '@/lib/monk-types'
import { defaultMonkData, loadMonk, saveMonk } from '@/lib/monk-storage'

export type DataServiceContext = {
  userId: string | null
  isPro: boolean
}

export const SCHEDULE_ANCHOR_DATE = '2000-01-01'
export const JOURNAL_ANCHOR_DATE = '1999-12-31'
export const GOAL_ANCHOR_DATE = '1999-12-30'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function shouldSyncToCloud(ctx: DataServiceContext): boolean {
  return !!ctx.userId && ctx.isPro
}

export function newHabitClientId(ctx: DataServiceContext): string {
  return shouldSyncToCloud(ctx)
    ? crypto.randomUUID()
    : `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function newGoalClientId(ctx: DataServiceContext): string {
  return shouldSyncToCloud(ctx)
    ? crypto.randomUUID()
    : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function newTimeSlotClientId(ctx: DataServiceContext): string {
  return shouldSyncToCloud(ctx)
    ? crypto.randomUUID()
    : `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function isUuid(s: string): boolean {
  return UUID_RE.test(s)
}

/** Remap non-UUID ids so Supabase uuid columns accept inserts. */
export function normalizeMonkDataForPro(data: MonkData): MonkData {
  const idMap = new Map<string, string>()
  const habits = data.habits.map((h) => {
    if (isUuid(h.id)) return { ...h, icon: h.icon ?? '' }
    const nu = crypto.randomUUID()
    idMap.set(h.id, nu)
    return { ...h, id: nu, icon: h.icon ?? '' }
  })
  const habitLog: HabitLog = { ...data.habitLog }
  for (const [oldId, newId] of idMap) {
    if (habitLog[oldId]) {
      habitLog[newId] = habitLog[oldId]
      delete habitLog[oldId]
    }
  }
  const goals = data.goals.map((g) =>
    isUuid(g.id) ? g : { ...g, id: crypto.randomUUID() },
  )
  const timeSlots = data.timeSlots.map((t) =>
    isUuid(t.id) ? t : { ...t, id: crypto.randomUUID() },
  )
  return { ...data, habits, habitLog, goals, timeSlots }
}

function mergeVideoFields(base: MonkData): MonkData {
  const local = loadMonk()
  return {
    ...base,
    morningVideoUrl: local.morningVideoUrl,
    morningVideoNote: local.morningVideoNote,
  }
}

function isCloudDatasetEmpty(
  habits: number,
  goals: number,
  completions: number,
  slots: number,
  journal: number,
): boolean {
  return (
    habits === 0 &&
    goals === 0 &&
    completions === 0 &&
    slots === 0 &&
    journal === 0
  )
}

function completionsToHabitLog(
  rows: { habit_id: string; date: string; completed: boolean }[],
): HabitLog {
  const log: HabitLog = {}
  for (const r of rows) {
    if (!r.completed) continue
    if (!log[r.habit_id]) log[r.habit_id] = {}
    log[r.habit_id][r.date] = true
  }
  return log
}

function habitLogToCompletionRows(
  userId: string,
  habitLog: HabitLog,
): { user_id: string; habit_id: string; date: string; completed: boolean }[] {
  const out: { user_id: string; habit_id: string; date: string; completed: boolean }[] =
    []
  for (const [habitId, byDate] of Object.entries(habitLog)) {
    if (!isUuid(habitId)) continue
    for (const [d, done] of Object.entries(byDate)) {
      if (done) {
        out.push({
          user_id: userId,
          habit_id: habitId,
          date: d,
          completed: true,
        })
      }
    }
  }
  return out
}

function mostRecentCompletionDate(log: HabitLog): string | null {
  let best: string | null = null
  for (const m of Object.values(log)) {
    for (const [d, v] of Object.entries(m)) {
      if (v && (!best || d > best)) best = d
    }
  }
  return best
}

export type LoadMonkResult = { data: MonkData; error: string | null }

export type PersistMonkResult =
  | { ok: true; deferred?: boolean }
  | { ok: false; error: string }

export async function loadFullMonkData(
  ctx: DataServiceContext,
): Promise<LoadMonkResult> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return { data: loadMonk(), error: null }
  }

  const uid = ctx.userId

  const [habitsRes, compRes, goalsRes, slotsRes, journalRes] = await Promise.all([
    supabase.from('habits').select('id,name,icon').eq('user_id', uid),
    supabase.from('habit_completions').select('habit_id,date,completed').eq('user_id', uid),
    supabase
      .from('goals')
      .select('id,title,priority,completed,type,date')
      .eq('user_id', uid),
    supabase
      .from('planner_slots')
      .select('id,date,time_slot,activity,category,colour')
      .eq('user_id', uid)
      .eq('date', SCHEDULE_ANCHOR_DATE),
    supabase.from('journal_entries').select('*').eq('user_id', uid),
  ])

  const habitsN = habitsRes.data?.length ?? 0
  const goalsN = goalsRes.data?.length ?? 0
  const compN = compRes.data?.length ?? 0
  const slotsN = slotsRes.data?.length ?? 0
  const journalN = journalRes.data?.length ?? 0

  const local = loadMonk()
  const hadLocalPersisted =
    typeof window !== 'undefined' &&
    !!window.localStorage.getItem('monk-mode-mvp-v1')

  if (
    isCloudDatasetEmpty(habitsN, goalsN, compN, slotsN, journalN) &&
    hadLocalPersisted &&
    (local.habits.length > 0 || local.goals.length > 0)
  ) {
    const normalized = normalizeMonkDataForPro(local)
    await persistFullMonkData(ctx, normalized)
    return { data: mergeVideoFields(normalized), error: null }
  }

  if (
    habitsRes.error ||
    compRes.error ||
    goalsRes.error ||
    slotsRes.error ||
    journalRes.error
  ) {
    console.error('MonkMode cloud load error', {
      habitsRes,
      compRes,
      goalsRes,
      slotsRes,
      journalRes,
    })
    return {
      data: mergeVideoFields(local),
      error:
        "Couldn't load your data. Check your connection and try again.",
    }
  }

  const habits: Habit[] = (habitsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon ?? '',
  }))

  const habitLog = completionsToHabitLog(compRes.data ?? [])

  const goals: Goal[] = (goalsRes.data ?? []).map((r) => ({
    id: r.id,
    text: r.title,
    completed: r.completed,
  }))

  const timeSlots: TimeSlot[] = (slotsRes.data ?? []).map((r) => ({
    id: r.id,
    time: r.time_slot,
    category: r.category,
    activity: r.activity,
    colorClass: r.colour,
  }))

  let gratitude: string[] = ['', '', '']
  let achievements: string[] = ['', '', '']
  for (const row of journalRes.data ?? []) {
    if (row.date !== JOURNAL_ANCHOR_DATE) continue
    if (row.type === 'morning') {
      gratitude = [row.entry_1 ?? '', row.entry_2 ?? '', row.entry_3 ?? '']
    } else if (row.type === 'evening') {
      achievements = [row.entry_1 ?? '', row.entry_2 ?? '', row.entry_3 ?? '']
    }
  }

  const base: MonkData = {
    habits,
    goals,
    gratitude,
    achievements,
    morningVideoUrl: local.morningVideoUrl,
    morningVideoNote: local.morningVideoNote,
    timeSlots,
    habitLog,
  }

  return { data: base, error: null }
}

export async function persistFullMonkData(
  ctx: DataServiceContext,
  data: MonkData,
): Promise<PersistMonkResult> {
  saveMonk(data)

  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return { ok: true }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      localStorage.setItem('monk_deferred_cloud_sync', '1')
    } catch {
      /* ignore */
    }
    return { ok: true, deferred: true }
  }

  const uid = ctx.userId
  const normalized = normalizeMonkDataForPro(data)
  const failures: string[] = []

  const habitRows = normalized.habits.map((h) => ({
    id: h.id,
    user_id: uid,
    name: h.name,
    icon: h.icon ?? '',
  }))

  await supabase.from('habit_completions').delete().eq('user_id', uid)
  await supabase.from('habits').delete().eq('user_id', uid)
  if (habitRows.length) {
    const { error: hErr } = await supabase.from('habits').insert(habitRows)
    if (hErr) {
      console.error('habits insert', hErr)
      failures.push(hErr.message)
    }
  }

  const compRows = habitLogToCompletionRows(uid, normalized.habitLog)
  if (compRows.length) {
    const { error: cErr } = await supabase
      .from('habit_completions')
      .insert(compRows)
    if (cErr) {
      console.error('habit_completions insert', cErr)
      failures.push(cErr.message)
    }
  }

  const goalRows = normalized.goals.map((g) => ({
    id: g.id,
    user_id: uid,
    title: g.text,
    priority: 0,
    completed: g.completed,
    type: 'daily' as const,
    date: GOAL_ANCHOR_DATE,
  }))

  await supabase.from('goals').delete().eq('user_id', uid)
  if (goalRows.length) {
    const { error: gErr } = await supabase.from('goals').insert(goalRows)
    if (gErr) {
      console.error('goals insert', gErr)
      failures.push(gErr.message)
    }
  }

  await supabase
    .from('planner_slots')
    .delete()
    .eq('user_id', uid)
    .eq('date', SCHEDULE_ANCHOR_DATE)

  const slotRows = normalized.timeSlots.map((t) => ({
    id: t.id,
    user_id: uid,
    date: SCHEDULE_ANCHOR_DATE,
    time_slot: t.time,
    activity: t.activity,
    category: t.category,
    colour: t.colorClass,
  }))

  if (slotRows.length) {
    const { error: pErr } = await supabase.from('planner_slots').insert(slotRows)
    if (pErr) {
      console.error('planner_slots insert', pErr)
      failures.push(pErr.message)
    }
  }

  const g0 = normalized.gratitude[0] ?? ''
  const g1 = normalized.gratitude[1] ?? ''
  const g2 = normalized.gratitude[2] ?? ''
  const a0 = normalized.achievements[0] ?? ''
  const a1 = normalized.achievements[1] ?? ''
  const a2 = normalized.achievements[2] ?? ''

  const journalUpserts = [
    {
      user_id: uid,
      date: JOURNAL_ANCHOR_DATE,
      type: 'morning' as const,
      entry_1: g0,
      entry_2: g1,
      entry_3: g2,
    },
    {
      user_id: uid,
      date: JOURNAL_ANCHOR_DATE,
      type: 'evening' as const,
      entry_1: a0,
      entry_2: a1,
      entry_3: a2,
    },
  ]

  const { error: jErr } = await supabase
    .from('journal_entries')
    .upsert(journalUpserts, { onConflict: 'user_id,date,type' })
  if (jErr) {
    console.error('journal_entries upsert', jErr)
    failures.push(jErr.message)
  }

  const current = computeStreak(normalized.habitLog)
  const { data: prevRow } = await supabase
    .from('streaks')
    .select('best_streak')
    .eq('user_id', uid)
    .maybeSingle()
  const prevBest = (prevRow as { best_streak?: number } | null)?.best_streak ?? 0
  const best = Math.max(prevBest, current)
  const lastD = mostRecentCompletionDate(normalized.habitLog)

  const { error: stErr } = await supabase.from('streaks').upsert(
    {
      user_id: uid,
      current_streak: current,
      best_streak: best,
      last_completed_date: lastD,
    },
    { onConflict: 'user_id' },
  )
  if (stErr) {
    console.error('streaks upsert', stErr)
    failures.push(stErr.message)
  }

  if (failures.length > 0) {
    return { ok: false, error: failures[0] }
  }

  try {
    localStorage.removeItem('monk_deferred_cloud_sync')
  } catch {
    /* ignore */
  }
  return { ok: true }
}

/** Clears local storage and, for Pro, all synced tables for the user. */
export async function resetAllUserData(ctx: DataServiceContext): Promise<void> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const uid = ctx.userId
    await supabase.from('habit_completions').delete().eq('user_id', uid)
    await supabase.from('habits').delete().eq('user_id', uid)
    await supabase.from('goals').delete().eq('user_id', uid)
    await supabase.from('planner_slots').delete().eq('user_id', uid)
    await supabase.from('journal_entries').delete().eq('user_id', uid)
    await supabase.from('streaks').delete().eq('user_id', uid)
  }
  saveMonk(defaultMonkData)
}

// --- Granular API (localStorage when not Pro cloud) ---

export async function getHabits(ctx: DataServiceContext): Promise<Habit[]> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('habits')
      .select('id,name,icon')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: true })
    if (error) {
      console.error(error)
      return loadMonk().habits
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon ?? '',
    }))
  }
  return loadMonk().habits
}

export async function saveHabit(
  ctx: DataServiceContext,
  habit: Habit,
): Promise<{ error: string | null }> {
  const h = { ...habit, icon: habit.icon ?? '' }
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return { error: null }
  const { error } = await supabase.from('habits').upsert(
    {
      id: h.id,
      user_id: ctx.userId,
      name: h.name,
      icon: h.icon,
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.error(error)
    return { error: error.message }
  }
  return { error: null }
}

export async function deleteHabit(ctx: DataServiceContext, id: string): Promise<void> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return
  await supabase.from('habits').delete().eq('id', id).eq('user_id', ctx.userId)
}

export async function getGoals(ctx: DataServiceContext): Promise<Goal[]> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('id,title,completed')
      .eq('user_id', ctx.userId)
    if (error) {
      console.error(error)
      return loadMonk().goals
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      text: r.title,
      completed: r.completed,
    }))
  }
  return loadMonk().goals
}

export async function saveGoal(
  ctx: DataServiceContext,
  goal: Goal,
  meta?: { priority?: number; type?: 'daily' | 'weekly' | 'monthly'; date?: string },
): Promise<{ error: string | null }> {
  const priority = meta?.priority ?? 0
  const type = meta?.type ?? 'daily'
  const date = meta?.date ?? GOAL_ANCHOR_DATE

  if (!shouldSyncToCloud(ctx) || !ctx.userId) return { error: null }
  const { error } = await supabase.from('goals').upsert(
    {
      id: goal.id,
      user_id: ctx.userId,
      title: goal.text,
      priority,
      completed: goal.completed,
      type,
      date,
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.error(error)
    return { error: error.message }
  }
  return { error: null }
}

/** Persist goal with updated `completed` (caller applies toggle in UI state first). */
export async function toggleGoalComplete(
  ctx: DataServiceContext,
  goal: Goal,
): Promise<{ error: string | null }> {
  return saveGoal(ctx, goal)
}

export async function deleteGoal(ctx: DataServiceContext, id: string): Promise<void> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return
  await supabase.from('goals').delete().eq('id', id).eq('user_id', ctx.userId)
}

export async function getPlannerSlots(ctx: DataServiceContext): Promise<TimeSlot[]> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('planner_slots')
      .select('id,time_slot,activity,category,colour')
      .eq('user_id', ctx.userId)
      .eq('date', SCHEDULE_ANCHOR_DATE)
    if (error) {
      console.error(error)
      return loadMonk().timeSlots
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      time: r.time_slot,
      category: r.category,
      activity: r.activity,
      colorClass: r.colour,
    }))
  }
  return loadMonk().timeSlots
}

export async function savePlannerSlot(
  ctx: DataServiceContext,
  slot: TimeSlot,
): Promise<{ error: string | null }> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return { error: null }
  const { error } = await supabase.from('planner_slots').upsert(
    {
      id: slot.id,
      user_id: ctx.userId,
      date: SCHEDULE_ANCHOR_DATE,
      time_slot: slot.time,
      activity: slot.activity,
      category: slot.category,
      colour: slot.colorClass,
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.error(error)
    return { error: error.message }
  }
  return { error: null }
}

export async function deletePlannerSlot(
  ctx: DataServiceContext,
  id: string,
): Promise<void> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return
  await supabase.from('planner_slots').delete().eq('id', id).eq('user_id', ctx.userId)
}

/**
 * Inserts planner rows for the same time block on selected weekdays (Mon=0 … Sun=6)
 * for the week that starts on `weekStartMonday`.
 */
export async function applyTimeBlockToPlannerWeek(
  ctx: DataServiceContext,
  block: Pick<TimeSlot, 'time' | 'category' | 'activity' | 'colorClass'>,
  dayIndices: number[],
  weekStartMonday: Date,
): Promise<{ error: string | null }> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return { error: 'SIGN_IN_REQUIRED' }
  }
  const uniq = [...new Set(dayIndices)].filter((i) => i >= 0 && i <= 6)
  if (uniq.length === 0) return { error: null }

  const rows = uniq.map((di) => ({
    id: crypto.randomUUID(),
    user_id: ctx.userId,
    date: format(addDays(weekStartMonday, di), 'yyyy-MM-dd'),
    time_slot: block.time,
    activity: block.activity,
    category: block.category,
    colour: block.colorClass,
  }))

  const { error } = await supabase.from('planner_slots').insert(rows)
  if (error) {
    console.error('applyTimeBlockToPlannerWeek', error)
    return { error: error.message }
  }
  return { error: null }
}

export type JournalType = 'morning' | 'evening'

export async function getJournalEntry(
  ctx: DataServiceContext,
  _date: string,
  type: JournalType,
): Promise<{ entry_1: string; entry_2: string; entry_3: string }> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('entry_1,entry_2,entry_3')
      .eq('user_id', ctx.userId)
      .eq('date', JOURNAL_ANCHOR_DATE)
      .eq('type', type)
      .maybeSingle()
    if (!error && data) {
      return {
        entry_1: data.entry_1 ?? '',
        entry_2: data.entry_2 ?? '',
        entry_3: data.entry_3 ?? '',
      }
    }
  }
  const d = loadMonk()
  const arr = type === 'morning' ? d.gratitude : d.achievements
  return {
    entry_1: arr[0] ?? '',
    entry_2: arr[1] ?? '',
    entry_3: arr[2] ?? '',
  }
}

export async function saveJournalEntry(
  ctx: DataServiceContext,
  _date: string,
  type: JournalType,
  entries: { entry_1: string; entry_2: string; entry_3: string },
): Promise<void> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { error } = await supabase.from('journal_entries').upsert(
      {
        user_id: ctx.userId,
        date: JOURNAL_ANCHOR_DATE,
        type,
        entry_1: entries.entry_1,
        entry_2: entries.entry_2,
        entry_3: entries.entry_3,
      },
      { onConflict: 'user_id,date,type' },
    )
    if (error) console.error(error)
    return
  }
  const d = loadMonk()
  if (type === 'morning') {
    saveMonk({
      ...d,
      gratitude: [entries.entry_1, entries.entry_2, entries.entry_3],
    })
  } else {
    saveMonk({
      ...d,
      achievements: [entries.entry_1, entries.entry_2, entries.entry_3],
    })
  }
}

export type StreakSnapshot = {
  current_streak: number
  best_streak: number
  last_completed_date: string | null
}

export async function getStreak(ctx: DataServiceContext): Promise<StreakSnapshot> {
  const log = loadMonk().habitLog
  const derivedCurrent = computeStreak(log)
  const last = mostRecentCompletionDate(log)

  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('streaks')
      .select('current_streak,best_streak,last_completed_date')
      .eq('user_id', ctx.userId)
      .maybeSingle()
    if (!error && data) {
      return {
        current_streak: data.current_streak ?? derivedCurrent,
        best_streak: data.best_streak ?? derivedCurrent,
        last_completed_date: data.last_completed_date ?? last,
      }
    }
  }

  return {
    current_streak: derivedCurrent,
    best_streak: derivedCurrent,
    last_completed_date: last,
  }
}

export async function updateStreak(
  ctx: DataServiceContext,
  habitLog: HabitLog,
): Promise<void> {
  const current = computeStreak(habitLog)
  const lastD = mostRecentCompletionDate(habitLog)

  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data: prevRow } = await supabase
      .from('streaks')
      .select('best_streak')
      .eq('user_id', ctx.userId)
      .maybeSingle()
    const prevBest = (prevRow as { best_streak?: number } | null)?.best_streak ?? 0
    const best = Math.max(prevBest, current)
    const { error } = await supabase.from('streaks').upsert(
      {
        user_id: ctx.userId,
        current_streak: current,
        best_streak: best,
        last_completed_date: lastD,
      },
      { onConflict: 'user_id' },
    )
    if (error) console.error(error)
  }
}

/**
 * Sync one habit completion cell to Supabase (Pro). React state / debounced persist own localStorage.
 */
export async function setHabitCompletion(
  ctx: DataServiceContext,
  habitId: string,
  dateKey: string,
  completed: boolean,
  nextHabitLog: HabitLog,
): Promise<void> {
  if (shouldSyncToCloud(ctx) && ctx.userId && isUuid(habitId)) {
    if (completed) {
      await supabase.from('habit_completions').upsert(
        {
          user_id: ctx.userId,
          habit_id: habitId,
          date: dateKey,
          completed: true,
        },
        { onConflict: 'user_id,habit_id,date' },
      )
    } else {
      await supabase
        .from('habit_completions')
        .delete()
        .eq('user_id', ctx.userId)
        .eq('habit_id', habitId)
        .eq('date', dateKey)
    }
  }

  await updateStreak(ctx, nextHabitLog)
}
