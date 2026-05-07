import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { MilestoneCelebrationPayload } from '@/lib/milestoneCelebration'
import { supabase } from '@/lib/supabase'

function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((n) => Number(n))
  if (!y || !m || !d) return startOfDay(new Date())
  return startOfDay(new Date(y, m - 1, d))
}

export type Phase = 'student' | 'monk' | 'master'

export type ProgramEnrollment = {
  id: string
  userId: string
  startDate: string
  currentDay: number
  phase: Phase
  status: string
  completedDays: number[]
  lastActiveDate: string | null
  isTestMode: boolean
  testDayOverride: number | null
}

export function getPhaseFromDay(day: number): Phase {
  if (day <= 30) return 'student'
  if (day <= 60) return 'monk'
  return 'master'
}

export function getPhaseLabel(phase: Phase): string {
  const labels: Record<Phase, string> = {
    student: 'Sprint',
    monk: 'Transform',
    master: 'Mastery',
  }
  return labels[phase]
}

export function getPhaseColor(phase: Phase): string {
  const colors: Record<Phase, string> = {
    student: '#5B6BA8',
    monk: '#8B7EC8',
    master: '#D4AF37',
  }
  return colors[phase]
}

/** Calendar day index in the program (1 = first day). Capped at 90. */
export function getDaysSinceStart(startDate: string): number {
  const start = parseLocalDateKey(startDate)
  const today = startOfDay(new Date())
  const raw = differenceInCalendarDays(today, start) + 1
  return Math.min(90, Math.max(1, raw))
}

function todayDateKey(): string {
  return startOfDay(new Date()).toISOString().slice(0, 10)
}

export async function getEnrollment(userId: string): Promise<ProgramEnrollment | null> {
  try {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null

    const { data: userData } = await supabase
      .from('users')
      .select('test_mode_enabled, test_day_override')
      .eq('id', userId)
      .maybeSingle()

    const isTestMode = userData?.test_mode_enabled === true
    const rawOverride = userData?.test_day_override as number | null | undefined
    const testDayOverride =
      typeof rawOverride === 'number' && Number.isFinite(rawOverride) ? rawOverride : null

    let actualDay = Math.min(getDaysSinceStart(data.start_date as string), 90)

    if (isTestMode && testDayOverride != null) {
      actualDay = Math.min(90, Math.max(1, Math.floor(testDayOverride)))
    }

    const phase = getPhaseFromDay(actualDay)

    if ((actualDay !== data.current_day || phase !== data.phase) && !isTestMode) {
      const { error: updateError } = await supabase
        .from('program_enrollments')
        .update({
          current_day: Math.min(actualDay, 90),
          phase,
          last_active_date: todayDateKey(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('getEnrollment sync error:', updateError)
      }
    }

    return {
      id: data.id as string,
      userId: data.user_id as string,
      startDate: data.start_date as string,
      currentDay: actualDay,
      phase,
      status: (data.status as string) ?? 'active',
      completedDays: Array.isArray(data.completed_days) ? (data.completed_days as number[]) : [],
      lastActiveDate: (data.last_active_date as string | null) ?? null,
      isTestMode,
      testDayOverride,
    }
  } catch (err) {
    console.error('getEnrollment error:', err)
    return null
  }
}

/** Local midnight boundary when program day `currentDay + 1` becomes available. */
export function getNextProgramDayUnlockAt(startDate: string, currentDay: number): Date {
  const start = parseLocalDateKey(startDate)
  return addDays(start, currentDay)
}

/** Server (service role) or browser client — upserts program_enrollments. */
export async function enrollProgramForUser(
  client: SupabaseClient,
  userId: string,
  startDate?: string,
): Promise<boolean> {
  const date = startDate ?? todayDateKey()
  const { error } = await client.from('program_enrollments').upsert(
    {
      user_id: userId,
      start_date: date,
      current_day: 1,
      phase: 'student',
      status: 'active',
      completed_days: [],
      last_active_date: date,
      updated_at: new Date().toISOString(),
      // Required: CHECK (program_type IN ('legacy','sprint','transform','mastery')).
      // Older migrations left DEFAULT '60day' on the column; omitting this caused inserts to fail in production.
      program_type: 'legacy',
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('enrollProgramForUser error:', error)
    return false
  }
  return true
}

/** CMS tracks that match `user_programs.program_type` + onboarding intake. */
const ENROLLMENT_TRACKS_FROM_INTAKE = new Set<ProgramType>([
  'sprint_standard',
  'sprint_monk',
  'transform',
])

/**
 * Upserts `program_enrollments` for a CMS track (Day 1, active, today as start).
 * Keeps Today (`useProgram`) and `user_programs` in sync after intake persistence.
 */
export async function upsertProgramEnrollmentForTrack(
  client: SupabaseClient,
  userId: string,
  programType: ProgramType,
  opts?: { startDate?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ENROLLMENT_TRACKS_FROM_INTAKE.has(programType)) {
    return {
      ok: false,
      error: `program_enrollments not upserted for program_type: ${programType}`,
    }
  }
  const date = opts?.startDate ?? todayDateKey()
  const now = new Date().toISOString()
  const { error } = await client.from('program_enrollments').upsert(
    {
      user_id: userId,
      program_type: programType,
      start_date: date,
      current_day: 1,
      phase: 'student',
      status: 'active',
      paused_at: null,
      completed_days: [],
      last_active_date: date,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('upsertProgramEnrollmentForTrack', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function enrollUser(
  userId: string,
  startDate?: string,
): Promise<ProgramEnrollment | null> {
  const ok = await enrollProgramForUser(supabase, userId, startDate)
  if (!ok) return null
  return getEnrollment(userId)
}

export type MarkDayCompleteResult =
  | { ok: true; milestone?: MilestoneCelebrationPayload }
  | { ok: false }

export async function markDayComplete(
  userId: string,
  dayNumber: number,
): Promise<MarkDayCompleteResult> {
  const { data: current, error: fetchError } = await supabase
    .from('program_enrollments')
    .select('completed_days')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError || !current) return { ok: false }

  const completedDays = [...((current.completed_days as number[] | null) ?? [])]
  if (!completedDays.includes(dayNumber)) {
    completedDays.push(dayNumber)
    completedDays.sort((a, b) => a - b)
  }

  const { error } = await supabase
    .from('program_enrollments')
    .update({
      completed_days: completedDays,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) return { ok: false }

  const { tryRecordProgramMilestone } = await import('@/lib/milestoneCelebration')
  const milestone = await tryRecordProgramMilestone(userId, dayNumber, {
    completedDaysCount: completedDays.length,
  })

  const { error: buddyRpcErr } = await supabase.rpc('refresh_buddy_pair_eligibility')
  if (buddyRpcErr) {
    console.warn('refresh_buddy_pair_eligibility:', buddyRpcErr.message)
  }

  const { error: buddyNotifyErr } = await supabase.rpc('notify_buddy_partner_day_complete', {
    p_completed_day: dayNumber,
  })
  if (buddyNotifyErr) {
    console.warn('notify_buddy_partner_day_complete:', buddyNotifyErr.message)
  }

  return { ok: true, milestone: milestone ?? undefined }
}

export type ProgramType =
  | '60day'
  | 'sprint_standard'
  | 'sprint_monk'
  | 'transform'
  | 'mastery'

export const PROGRAM_DURATIONS: Record<ProgramType, number> = {
  '60day': 60,
  sprint_standard: 30,
  sprint_monk: 21,
  transform: 56,
  mastery: 90,
}

export const PROGRAM_LABELS: Record<ProgramType, string> = {
  '60day': '60-Day MonkMode',
  sprint_standard: '30-Day Sprint',
  sprint_monk: '21-Day Monk Mode',
  transform: '56-Day Transform',
  mastery: '90-Day Mastery',
}

/** Continuation Pro days after the program’s calendar length (business rule). */
export const PROGRAM_BUNDLE_PRO_EXTRA_DAYS = 30

/**
 * ISO timestamp: end of the last calendar day of bundled Pro access.
 * Rule: **program length (calendar days) + continuation days** from enrollment start
 * (enrollment date = program day 1). Equivalent to: last program calendar day, then
 * {@link PROGRAM_BUNDLE_PRO_EXTRA_DAYS} more calendar days of Pro.
 */
export function computeProgramProAccessUntilIso(
  enrollmentStartDateKey: string,
  programType: ProgramType,
): string {
  const programLengthDays = PROGRAM_DURATIONS[programType] ?? 30
  const continuationDays = PROGRAM_BUNDLE_PRO_EXTRA_DAYS

  const start = parseLocalDateKey(enrollmentStartDateKey)
  const lastProgramCalendarDay = addDays(start, programLengthDays - 1)
  const lastProCalendarDay = addDays(lastProgramCalendarDay, continuationDays)

  const end = new Date(lastProCalendarDay)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

/** Effective max program day index (1-based): optional admin override vs track default. */
export function effectiveMaxProgramDay(
  programType: string | null | undefined,
  maxProgramDayOverride: number | null | undefined,
): number {
  const pt = programType ?? '60day'
  const t = pt as ProgramType
  const base =
    t in PROGRAM_DURATIONS
      ? PROGRAM_DURATIONS[t]
      : pt === 'legacy' || pt === 'sprint'
        ? 60
        : 90
  if (
    maxProgramDayOverride != null &&
    Number.isFinite(maxProgramDayOverride) &&
    maxProgramDayOverride >= 1
  ) {
    return Math.min(365, Math.max(base, Math.floor(maxProgramDayOverride)))
  }
  return base
}

export async function pauseProgram(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('program_enrollments')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  return !error
}

export async function resumeProgram(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('program_enrollments')
    .update({
      status: 'active',
      paused_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  return !error
}

export async function restartProgram(userId: string): Promise<boolean> {
  const { error: resetError } = await supabase
    .from('program_enrollments')
    .update({
      current_day: 1,
      phase: 'student',
      status: 'active',
      paused_at: null,
      completed_days: [],
      start_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (resetError) return false

  await supabase
    .from('users')
    .update({
      test_mode_enabled: false,
      test_day_override: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return true
}

export async function getProgramType(userId: string): Promise<ProgramType> {
  const { data } = await supabase
    .from('program_enrollments')
    .select('program_type')
    .eq('user_id', userId)
    .maybeSingle()

  return (data?.program_type as ProgramType) || '60day'
}

export async function isProgramPaused(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('program_enrollments')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  return data?.status === 'paused'
}

export function getMaxDays(programType: ProgramType): number {
  return PROGRAM_DURATIONS[programType] || 60
}

export async function advanceDayForProgram(
  userId: string,
  programType: ProgramType,
): Promise<boolean> {
  const enrollment = await getEnrollment(userId)
  if (!enrollment) return false

  const maxDays = getMaxDays(programType)
  const nextDay = enrollment.currentDay + 1

  if (nextDay > maxDays) {
    await supabase
      .from('program_enrollments')
      .update({
        status: 'completed',
        current_day: maxDays,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    return true
  }

  const result = await markDayComplete(userId, enrollment.currentDay)
  return result.ok
}
