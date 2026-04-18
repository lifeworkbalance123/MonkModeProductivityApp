import { supabase } from '@/lib/supabase'
import { getProgramType, type ProgramType } from '@/lib/programUtils'
import {
  getMilestoneDisplayName,
  hasMilestoneRecorded,
  isMilestoneDay,
  recordUserMilestone,
} from '@/lib/userMilestones'

export type MilestoneCelebrationPayload = {
  milestoneDay: number
  milestoneName: string
  programType: ProgramType
  /** ISO time when optional rest window ends (24h from celebration), if applied. */
  restPeriodEndsAt: string | null
}

const REST_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * If this calendar day is a milestone for the user's program, records `user_milestones`,
 * optionally sets a 24h rest window on enrollment, and returns UI payload (once per milestone).
 */
export async function tryRecordProgramMilestone(
  userId: string,
  dayNumber: number,
  ctx: { completedDaysCount: number },
): Promise<MilestoneCelebrationPayload | null> {
  const programType = await getProgramType(userId)

  if (!isMilestoneDay(programType, dayNumber)) return null

  if (await hasMilestoneRecorded(userId, programType, dayNumber)) return null

  const milestoneName = getMilestoneDisplayName(programType, dayNumber)
  const capturedAt = new Date().toISOString()

  const analyticsSnapshot: Record<string, unknown> = {
    v: 1,
    program_type: programType,
    milestone_day: dayNumber,
    completed_days_count: ctx.completedDaysCount,
    captured_at: capturedAt,
  }

  const ok = await recordUserMilestone(userId, programType, dayNumber, {
    milestoneName,
    analyticsSnapshot,
  })

  if (!ok) return null

  const restEnds = new Date(Date.now() + REST_WINDOW_MS)
  const restIso = restEnds.toISOString()

  const { error: restErr } = await supabase
    .from('program_enrollments')
    .update({
      rest_period_end: restIso,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  const restPeriodEndsAt = restErr ? null : restIso
  if (restErr) {
    console.warn('milestone rest_period_end update:', restErr.message)
  }

  return {
    milestoneDay: dayNumber,
    milestoneName,
    programType,
    restPeriodEndsAt,
  }
}
