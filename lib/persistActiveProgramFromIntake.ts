import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProgramIntakePayload } from '@/lib/onboardingProgramFlow'
import {
  pickDistractions,
  pickGoals,
  timeFieldsForUserPrograms,
  validateIntake,
} from '@/lib/onboardingIntakeValidation'
import { upsertProgramEnrollmentForTrack } from '@/lib/programUtils'

/**
 * Upserts `user_programs` (active day 1), today's `daily_logs`, and matching `program_enrollments`
 * from validated intake.
 * Used by POST /api/program/start and admin skip-payment completion.
 */
export async function persistActiveProgramFromIntake(
  supabase: SupabaseClient,
  userId: string,
  intake: ProgramIntakePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const err = validateIntake(intake)
  if (err) return { ok: false, error: err }

  const goals = pickGoals(intake)
  const dist = pickDistractions(intake)
  const times = timeFieldsForUserPrograms(intake)

  const programRow = {
    user_id: userId,
    program_type: intake.selected_program,
    program_day: 1,
    phase: 1,
    status: 'active',
    one_big_task: intake.one_big_task?.trim() || null,
    baseline_wake_time: times.baseline_wake_time,
    baseline_bed_time: times.baseline_bed_time,
    deadline_date: intake.deadline_date?.trim() || null,
    primary_goal: goals.length ? JSON.stringify(goals) : null,
    biggest_distraction: dist.length ? JSON.stringify(dist) : null,
    accountability_preference: intake.accountability_preference ?? null,
    monk_mode_confirmed: intake.monk_mode_confirmed ?? false,
    weekend_wake_time: times.weekend_wake_time,
    weekend_bed_time: times.weekend_bed_time,
  }

  const { error: upErr } = await supabase
    .from('user_programs')
    .upsert(programRow, { onConflict: 'user_id' })

  if (upErr) {
    console.error('persistActiveProgramFromIntake user_programs', upErr)
    return { ok: false, error: upErr.message }
  }

  const logDate = new Date().toISOString().split('T')[0]
  const { error: logErr } = await supabase.from('daily_logs').upsert(
    {
      user_id: userId,
      log_date: logDate,
      program_type: intake.selected_program,
      program_day: 1,
    },
    { onConflict: 'user_id,log_date' },
  )

  if (logErr) {
    console.error('persistActiveProgramFromIntake daily_logs', logErr)
    return { ok: false, error: logErr.message }
  }

  const en = await upsertProgramEnrollmentForTrack(
    supabase,
    userId,
    intake.selected_program,
    { startDate: logDate },
  )
  if (!en.ok) {
    return { ok: false, error: en.error }
  }

  return { ok: true }
}
