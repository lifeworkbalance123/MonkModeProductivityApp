/**
 * Client-side data layer: Pro + logged-in users sync to Supabase; Free or anonymous use localStorage.
 * Must only be imported from client components/hooks.
 */

import { addDays, format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { computeStreak } from '@/lib/monk-streak'
import type { Goal, Habit, HabitLog, MonkData, TimeSlot } from '@/lib/monk-types'
import { filterGoalsWithNonEmptyText } from '@/lib/goals-utils'
import {
  dedupeGoalsById,
  dedupeGoalsByNormalizedText,
  dedupeHabitsById,
  sanitizeMonkDuplicates,
} from '@/lib/monk-dedupe'
import { defaultMonkData, emptyMonkDataAfterReset, loadMonk, saveMonk } from '@/lib/monk-storage'
import type {
  PersonalTrainingCategory,
  PersonalTrainingResource,
} from '@/lib/personal-training-resources'
import {
  loadDeepWorkSessionsLocal,
  type DeepWorkSession,
} from '@/lib/deep-work-sessions'
import { loadDayLocal, saveDayPartial } from '@/lib/dashboard-day-local'
import {
  saveTemplate as upsertWeeklyScheduleTemplate,
  timeSlotsFromTemplate,
  scheduleTemplateFromTimeSlots,
  type ScheduleTemplate,
  type TemplateBlock,
} from '@/lib/scheduleTemplate'
import {
  enqueueLogHabit,
  readOfflineQueue,
  saveOfflineQueue,
  type LogHabitPayload,
  type OfflineAction,
} from '@/lib/offline-action-queue'

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
  const sanitized = sanitizeMonkDuplicates(data)
  const habitsIn = dedupeHabitsById(sanitized.habits)
  const goalsIn = dedupeGoalsById(sanitized.goals)

  const idMap = new Map<string, string>()
  const habits = habitsIn.map((h) => {
    if (isUuid(h.id)) return { ...h, icon: h.icon ?? '' }
    let nu = idMap.get(h.id)
    if (!nu) {
      nu = crypto.randomUUID()
      idMap.set(h.id, nu)
    }
    return { ...h, id: nu, icon: h.icon ?? '' }
  })
  const habitLog: HabitLog = { ...sanitized.habitLog }
  for (const [oldId, newId] of idMap) {
    if (habitLog[oldId]) {
      habitLog[newId] = habitLog[oldId]
      delete habitLog[oldId]
    }
  }
  const goalIdMap = new Map<string, string>()
  const goals = filterGoalsWithNonEmptyText(goalsIn).map((g) => {
    if (isUuid(g.id)) return g
    let nu = goalIdMap.get(g.id)
    if (!nu) {
      nu = crypto.randomUUID()
      goalIdMap.set(g.id, nu)
    }
    return { ...g, id: nu }
  })
  const timeSlots = sanitized.timeSlots.map((t) =>
    isUuid(t.id) ? t : { ...t, id: crypto.randomUUID() },
  )
  return {
    ...sanitized,
    habits,
    habitLog,
    goals,
    timeSlots,
  }
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
  templateBlocks: number,
): boolean {
  return (
    habits === 0 &&
    goals === 0 &&
    completions === 0 &&
    slots === 0 &&
    journal === 0 &&
    templateBlocks === 0
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

function looksOfflineLikeError(message: string): boolean {
  return /network|fetch|offline|internet|connection|timeout|failed to fetch/i.test(message)
}

export async function loadFullMonkData(
  ctx: DataServiceContext,
): Promise<LoadMonkResult> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return { data: loadMonk(), error: null }
  }

  const uid = ctx.userId

  const [habitsRes, compRes, goalsRes, slotsRes, journalRes, templateRes] = await Promise.all([
    supabase.from('habits').select('id,name,icon').eq('user_id', uid),
    supabase.from('habit_completions').select('habit_id,date,completed').eq('user_id', uid),
    supabase
      .from('goals')
      .select('id,title,priority,completed,type,date')
      .eq('user_id', uid)
      .eq('is_one_big_task', false),
    supabase
      .from('planner_slots')
      .select('id,date,time_slot,activity,category,colour')
      .eq('user_id', uid)
      .eq('date', SCHEDULE_ANCHOR_DATE),
    supabase.from('journal_entries').select('*').eq('user_id', uid),
    supabase
      .from('schedule_templates')
      .select('start_time,increment_minutes,block_count,blocks')
      .eq('user_id', uid)
      .maybeSingle(),
  ])

  const habitsN = habitsRes.data?.length ?? 0
  const goalsN = goalsRes.data?.length ?? 0
  const compN = compRes.data?.length ?? 0
  const slotsN = slotsRes.data?.length ?? 0
  const journalN = journalRes.data?.length ?? 0
  const templateBlocksN = Array.isArray(templateRes.data?.blocks)
    ? (templateRes.data!.blocks as unknown[]).length
    : 0

  const local = loadMonk()
  const hadLocalPersisted =
    typeof window !== 'undefined' &&
    !!window.localStorage.getItem('monk-mode-mvp-v1')

  if (
    isCloudDatasetEmpty(habitsN, goalsN, compN, slotsN, journalN, templateBlocksN) &&
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
    journalRes.error ||
    templateRes.error
  ) {
    console.error('monkcubed cloud load error', {
      habitsRes,
      compRes,
      goalsRes,
      slotsRes,
      journalRes,
      templateRes,
    })
    return {
      data: mergeVideoFields(local),
      error:
        "Couldn't load your data. Check your connection and try again.",
    }
  }

  const habits: Habit[] = dedupeHabitsById(
    (habitsRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon ?? '',
    })),
  )

  const habitLog = completionsToHabitLog(compRes.data ?? [])

  const goals: Goal[] = filterGoalsWithNonEmptyText(
    dedupeGoalsByNormalizedText(
      (goalsRes.data ?? []).map((r) => ({
        id: r.id,
        text: r.title ?? '',
        completed: r.completed,
      })),
    ),
  )

  let timeSlots: TimeSlot[]
  const tplRow = templateRes.data
  if (
    tplRow &&
    Array.isArray(tplRow.blocks) &&
    (tplRow.blocks as unknown[]).length > 0
  ) {
    const st: ScheduleTemplate = {
      userId: uid,
      startTime: tplRow.start_time,
      incrementMinutes: tplRow.increment_minutes,
      blockCount: tplRow.block_count,
      blocks: tplRow.blocks as TemplateBlock[],
    }
    timeSlots = timeSlotsFromTemplate(st)
  } else {
    timeSlots = (slotsRes.data ?? []).map((r) => ({
      id: r.id,
      time: r.time_slot,
      category: r.category,
      activity: r.activity,
      colorClass: r.colour,
    }))
  }

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

  return { data: sanitizeMonkDuplicates(base), error: null }
}

export async function persistFullMonkData(
  ctx: DataServiceContext,
  data: MonkData,
): Promise<PersistMonkResult> {
  saveMonk(data)

  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return { ok: true }
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
    is_one_big_task: false,
  }))

  await supabase.from('goals').delete().eq('user_id', uid).eq('is_one_big_task', false)
  if (goalRows.length) {
    const { error: gErr } = await supabase.from('goals').insert(goalRows)
    if (gErr) {
      console.error('goals insert', gErr)
      failures.push(gErr.message)
    }
  }

  const weeklyTpl = scheduleTemplateFromTimeSlots(uid, normalized.timeSlots)
  const tplSaved = await upsertWeeklyScheduleTemplate(weeklyTpl)
  if (!tplSaved) {
    console.error('schedule_templates upsert')
    failures.push('schedule_templates')
  }

  await supabase
    .from('planner_slots')
    .delete()
    .eq('user_id', uid)
    .eq('date', SCHEDULE_ANCHOR_DATE)

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
    if (failures.some(looksOfflineLikeError)) {
      try {
        localStorage.setItem('monk_deferred_cloud_sync', '1')
      } catch {
        /* ignore */
      }
      return { ok: true, deferred: true }
    }
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
    await supabase.from('schedule_templates').delete().eq('user_id', uid)
    await supabase.from('journal_entries').delete().eq('user_id', uid)
    await supabase.from('streaks').delete().eq('user_id', uid)
  }
  saveMonk(emptyMonkDataAfterReset)
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    await persistFullMonkData(ctx, emptyMonkDataAfterReset)
  }
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
      .eq('is_one_big_task', false)
    if (error) {
      console.error(error)
      return loadMonk().goals
    }
    return filterGoalsWithNonEmptyText(
      dedupeGoalsByNormalizedText(
        (data ?? []).map((r) => ({
          id: r.id,
          text: r.title,
          completed: r.completed,
        })),
      ),
    )
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
      is_one_big_task: false,
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
    const { data: tplRow, error: tErr } = await supabase
      .from('schedule_templates')
      .select('start_time,increment_minutes,block_count,blocks')
      .eq('user_id', ctx.userId)
      .maybeSingle()
    if (
      !tErr &&
      tplRow &&
      Array.isArray(tplRow.blocks) &&
      tplRow.blocks.length > 0
    ) {
      const st: ScheduleTemplate = {
        userId: ctx.userId,
        startTime: tplRow.start_time,
        incrementMinutes: tplRow.increment_minutes,
        blockCount: tplRow.block_count,
        blocks: tplRow.blocks as TemplateBlock[],
      }
      return timeSlotsFromTemplate(st)
    }
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
  let slots = await getPlannerSlots(ctx)
  const ix = slots.findIndex((s) => s.time === slot.time)
  if (ix >= 0) {
    const next = [...slots]
    next[ix] = slot
    slots = next
  } else {
    slots = [...slots, slot]
  }
  const tpl = scheduleTemplateFromTimeSlots(ctx.userId, slots)
  const ok = await upsertWeeklyScheduleTemplate(tpl)
  if (!ok) return { error: 'Could not save schedule' }
  await supabase
    .from('planner_slots')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('date', SCHEDULE_ANCHOR_DATE)
  return { error: null }
}

export async function deletePlannerSlot(
  ctx: DataServiceContext,
  id: string,
): Promise<void> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return
  let slots = await getPlannerSlots(ctx)
  slots = slots.filter((s) => s.id !== id)
  const tpl = scheduleTemplateFromTimeSlots(ctx.userId, slots)
  await upsertWeeklyScheduleTemplate(tpl)
  await supabase
    .from('planner_slots')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('date', SCHEDULE_ANCHOR_DATE)
}

/** Journal for a real calendar day (dashboard). Free tier uses localStorage. */
export async function loadDashboardDayJournal(
  ctx: DataServiceContext,
  date: string,
): Promise<{
  morning: [string, string, string]
  evening: [string, string, string]
}> {
  const z = (): [string, string, string] => ['', '', '']
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    const d = loadDayLocal(date)
    return {
      morning: (d?.gratitude ?? z()) as [string, string, string],
      evening: (d?.achievements ?? z()) as [string, string, string],
    }
  }
  const uid = ctx.userId
  const { data, error } = await supabase
    .from('journal_entries')
    .select('type,entry_1,entry_2,entry_3')
    .eq('user_id', uid)
    .eq('date', date)
  if (error) {
    console.error('loadDashboardDayJournal', error)
    return { morning: z(), evening: z() }
  }
  let morning = z()
  let evening = z()
  for (const row of data ?? []) {
    if (row.type === 'morning') {
      morning = [row.entry_1 ?? '', row.entry_2 ?? '', row.entry_3 ?? '']
    } else if (row.type === 'evening') {
      evening = [row.entry_1 ?? '', row.entry_2 ?? '', row.entry_3 ?? '']
    }
  }
  return { morning, evening }
}

export async function saveDashboardDayJournal(
  ctx: DataServiceContext,
  date: string,
  morning: [string, string, string],
  evening: [string, string, string],
): Promise<void> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    saveDayPartial(date, {
      gratitude: [...morning],
      achievements: [...evening],
    })
    return
  }
  const uid = ctx.userId
  const [m1, m2, m3] = morning
  const [e1, e2, e3] = evening
  const now = new Date().toISOString()

  if (m1.trim() || m2.trim() || m3.trim()) {
    const { error } = await supabase.from('journal_entries').upsert(
      {
        user_id: uid,
        date,
        type: 'morning' as const,
        entry_1: m1,
        entry_2: m2,
        entry_3: m3,
        updated_at: now,
      },
      { onConflict: 'user_id,date,type' },
    )
    if (error) console.error('saveDashboardDayJournal morning', error)
  } else {
    await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', uid)
      .eq('date', date)
      .eq('type', 'morning')
  }

  if (e1.trim() || e2.trim() || e3.trim()) {
    const { error } = await supabase.from('journal_entries').upsert(
      {
        user_id: uid,
        date,
        type: 'evening' as const,
        entry_1: e1,
        entry_2: e2,
        entry_3: e3,
        updated_at: now,
      },
      { onConflict: 'user_id,date,type' },
    )
    if (error) console.error('saveDashboardDayJournal evening', error)
  } else {
    await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', uid)
      .eq('date', date)
      .eq('type', 'evening')
  }
}

/** Planner slots for a real calendar day (dashboard). */
export async function loadPlannerSlotsForDate(
  ctx: DataServiceContext,
  date: string,
): Promise<TimeSlot[]> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return loadDayLocal(date)?.timeSlots ?? []
  }
  const { data, error } = await supabase
    .from('planner_slots')
    .select('id,time_slot,activity,category,colour')
    .eq('user_id', ctx.userId)
    .eq('date', date)
    .order('time_slot', { ascending: true })
  if (error) {
    console.error('loadPlannerSlotsForDate', error)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    time: r.time_slot,
    category: r.category ?? 'Personal',
    activity: r.activity ?? '',
    colorClass: r.colour ?? 'bg-muted',
  }))
}

export async function replacePlannerSlotsForDate(
  ctx: DataServiceContext,
  date: string,
  slots: TimeSlot[],
): Promise<{ error: string | null; slots: TimeSlot[] }> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    saveDayPartial(date, { timeSlots: slots })
    return { error: null, slots }
  }
  const uid = ctx.userId
  const { error: delErr } = await supabase
    .from('planner_slots')
    .delete()
    .eq('user_id', uid)
    .eq('date', date)
  if (delErr) {
    console.error('replacePlannerSlotsForDate delete', delErr)
    return { error: delErr.message, slots }
  }
  if (slots.length === 0) return { error: null, slots: [] }

  const rows = slots.map((t) => ({
    id: isUuid(t.id) ? t.id : crypto.randomUUID(),
    user_id: uid,
    date,
    time_slot: t.time,
    activity: t.activity,
    category: t.category,
    colour: t.colorClass,
  }))

  const { data: inserted, error } = await supabase
    .from('planner_slots')
    .insert(rows)
    .select('id,time_slot,activity,category,colour')

  if (error) {
    console.error('replacePlannerSlotsForDate insert', error)
    return { error: error.message, slots }
  }

  const mapped: TimeSlot[] = (inserted ?? []).map((r) => ({
    id: r.id,
    time: r.time_slot,
    category: r.category ?? 'Personal',
    activity: r.activity ?? '',
    colorClass: r.colour ?? 'bg-muted',
  }))
  return { error: null, slots: mapped }
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
 * Sync one habit cell to `habit_completions` only. Returns true if no error (or nothing to sync).
 */
export async function syncHabitCompletionToCloud(
  ctx: DataServiceContext,
  habitId: string,
  dateKey: string,
  completed: boolean,
): Promise<boolean> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId || !isUuid(habitId)) return true
  if (completed) {
    const { error } = await supabase.from('habit_completions').upsert(
      {
        user_id: ctx.userId,
        habit_id: habitId,
        date: dateKey,
        completed: true,
      },
      { onConflict: 'user_id,habit_id,date' },
    )
    if (error) {
      console.error('habit_completions upsert', error)
      return false
    }
    return true
  }
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('habit_id', habitId)
    .eq('date', dateKey)
  if (error) {
    console.error('habit_completions delete', error)
    return false
  }
  return true
}

/** Replay queued habit syncs after reconnect. Returns number successfully pushed. */
export async function replayOfflineHabitQueue(
  ctx: DataServiceContext,
): Promise<number> {
  const queue = readOfflineQueue()
  if (queue.length === 0) return 0
  const remaining: OfflineAction[] = []
  let replayed = 0
  for (const action of queue) {
    if (action.type !== 'LOG_HABIT') {
      remaining.push(action)
      continue
    }
    const d = action.data as LogHabitPayload
    const ok = await syncHabitCompletionToCloud(ctx, d.habitId, d.dateKey, d.completed)
    if (ok) replayed += 1
    else remaining.push(action)
  }
  saveOfflineQueue(remaining)
  return replayed
}

/**
 * Sync one habit completion cell to Supabase (Pro). React state / debounced persist own localStorage.
 * On cloud failure, queues `LOG_HABIT` in localStorage for {@link replayOfflineHabitQueue}.
 */
export async function setHabitCompletion(
  ctx: DataServiceContext,
  habitId: string,
  dateKey: string,
  completed: boolean,
  nextHabitLog: HabitLog,
): Promise<void> {
  const cloudOk = await syncHabitCompletionToCloud(ctx, habitId, dateKey, completed)
  if (
    !cloudOk &&
    shouldSyncToCloud(ctx) &&
    ctx.userId &&
    isUuid(habitId)
  ) {
    enqueueLogHabit({ habitId, dateKey, completed })
  }

  await updateStreak(ctx, nextHabitLog)
}

function normalizePersonalTrainingCategory(
  c: string | null | undefined,
): PersonalTrainingCategory {
  if (c === 'Video' || c === 'Article' || c === 'Podcast' || c === 'Other') return c
  return 'Other'
}

export async function listPersonalTrainingResources(
  ctx: DataServiceContext,
): Promise<PersonalTrainingResource[]> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return []
  const { data, error } = await supabase
    .from('user_training_resources')
    .select('id,title,resource_url,notes,category')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error(error)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title ?? '',
    url: (r as { resource_url?: string }).resource_url ?? '',
    notes: (r as { notes?: string }).notes ?? '',
    category: normalizePersonalTrainingCategory(
      (r as { category?: string }).category,
    ),
  }))
}

export async function upsertPersonalTrainingResource(
  ctx: DataServiceContext,
  resource: PersonalTrainingResource,
): Promise<{ error: string | null }> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return { error: null }
  const { error } = await supabase.from('user_training_resources').upsert(
    {
      id: resource.id,
      user_id: ctx.userId,
      title: resource.title,
      resource_url: resource.url,
      notes: resource.notes,
      category: resource.category,
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.error(error)
    return { error: error.message }
  }
  return { error: null }
}

export async function deletePersonalTrainingResource(
  ctx: DataServiceContext,
  id: string,
): Promise<void> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return
  await supabase
    .from('user_training_resources')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.userId)
}

export async function listDeepWorkSessions(
  ctx: DataServiceContext,
): Promise<DeepWorkSession[]> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) {
    return loadDeepWorkSessionsLocal()
  }
  const { data, error } = await supabase
    .from('deep_work_sessions')
    .select(
      'id,user_id,session_date,task_name,duration_minutes,completed,result,sprint_number,created_at',
    )
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) {
    // PostgrestError often serializes as "{}" in overlays; log explicit fields. Non-fatal — we fall back to [].
    console.warn(
      'listDeepWorkSessions:',
      [error.message, error.details, error.code].filter(Boolean).join(' · ') ||
        JSON.stringify(error),
    )
    return []
  }
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const result = r.result as string | null
    const normalizedResult =
      result === 'crushed' || result === 'progress' || result === 'distracted'
        ? result
        : null
    return {
      id: String(r.id),
      user_id: String(r.user_id ?? ''),
      date: String(r.session_date ?? ''),
      task_name: String(r.task_name ?? ''),
      duration_minutes: Number(r.duration_minutes ?? 0),
      completed: Boolean(r.completed),
      result: normalizedResult,
      sprint_number: Number(r.sprint_number ?? 1),
      created_at: String(r.created_at ?? new Date().toISOString()),
    }
  })
}

export async function insertDeepWorkSession(
  ctx: DataServiceContext,
  session: DeepWorkSession,
): Promise<{ error: string | null }> {
  if (!shouldSyncToCloud(ctx) || !ctx.userId) return { error: null }
  const { error } = await supabase.from('deep_work_sessions').insert({
    id: session.id,
    user_id: ctx.userId,
    session_date: session.date,
    task_name: session.task_name,
    duration_minutes: session.duration_minutes,
    completed: session.completed,
    result: session.result,
    sprint_number: session.sprint_number,
    created_at: session.created_at,
  })
  if (error) {
    console.error(error)
    return { error: error.message }
  }
  return { error: null }
}
