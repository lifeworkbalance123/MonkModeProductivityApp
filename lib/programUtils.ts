import type { SupabaseClient } from '@supabase/supabase-js'
import { differenceInCalendarDays, startOfDay } from 'date-fns'
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
}

export function getPhaseFromDay(day: number): Phase {
  if (day <= 30) return 'student'
  if (day <= 60) return 'monk'
  return 'master'
}

export function getPhaseLabel(phase: Phase): string {
  const labels: Record<Phase, string> = {
    student: 'Student',
    monk: 'Monk',
    master: 'Master',
  }
  return labels[phase]
}

export function getPhaseEmoji(phase: Phase): string {
  const emojis: Record<Phase, string> = {
    student: '📖',
    monk: '🧘',
    master: '🔥',
  }
  return emojis[phase]
}

export function getPhaseColor(phase: Phase): string {
  const colors: Record<Phase, string> = {
    student: '#3B82F6',
    monk: '#8B5CF6',
    master: '#F59E0B',
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

    const actualDay = getDaysSinceStart(data.start_date as string)
    const phase = getPhaseFromDay(actualDay)

    if (actualDay !== data.current_day || phase !== data.phase) {
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
      currentDay: Math.min(actualDay, 90),
      phase,
      status: (data.status as string) ?? 'active',
      completedDays: Array.isArray(data.completed_days) ? (data.completed_days as number[]) : [],
      lastActiveDate: (data.last_active_date as string | null) ?? null,
    }
  } catch (err) {
    console.error('getEnrollment error:', err)
    return null
  }
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
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('enrollProgramForUser error:', error)
    return false
  }
  return true
}

export async function enrollUser(
  userId: string,
  startDate?: string,
): Promise<ProgramEnrollment | null> {
  const ok = await enrollProgramForUser(supabase, userId, startDate)
  if (!ok) return null
  return getEnrollment(userId)
}

export async function markDayComplete(userId: string, dayNumber: number): Promise<boolean> {
  const { data: current, error: fetchError } = await supabase
    .from('program_enrollments')
    .select('completed_days')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError || !current) return false

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

  return !error
}
