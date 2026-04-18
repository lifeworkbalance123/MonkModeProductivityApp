import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programUtils'

/** Program days that trigger a milestone celebration (schedule matches product spec). */
export const MILESTONE_DAYS_BY_PROGRAM: Record<ProgramType, readonly number[]> = {
  '60day': [],
  sprint_standard: [30],
  sprint_monk: [21],
  transform: [21, 40, 60],
  mastery: [90],
}

export function isMilestoneDay(programType: ProgramType, programDay: number): boolean {
  const days = MILESTONE_DAYS_BY_PROGRAM[programType]
  return days.includes(programDay)
}

/** Display names for badge / celebration UI (per program type + day). */
export function getMilestoneDisplayName(programType: ProgramType, milestoneDay: number): string {
  const map: Partial<Record<ProgramType, Partial<Record<number, string>>>> = {
    sprint_standard: {
      30: 'Sprint milestone',
    },
    sprint_monk: {
      21: 'Monk Sprint complete',
    },
    transform: {
      21: 'Foundation Builder',
      40: 'Midpoint',
      60: 'Transform arc',
    },
    mastery: {
      90: 'Mastery complete',
    },
  }
  return map[programType]?.[milestoneDay] ?? `Day ${milestoneDay} milestone`
}

export type UserMilestoneRow = {
  id: string
  user_id: string
  program_type: ProgramType
  milestone_day: number
  milestone_name: string | null
  celebrated_at: string
  analytics_snapshot?: Record<string, unknown> | null
}

/** Returns true if this milestone was already recorded for the user. */
export async function hasMilestoneRecorded(
  userId: string,
  programType: ProgramType,
  milestoneDay: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_milestones')
    .select('id')
    .eq('user_id', userId)
    .eq('program_type', programType)
    .eq('milestone_day', milestoneDay)
    .maybeSingle()

  if (error) return false
  return !!data
}

/**
 * Insert a milestone row (idempotent: unique violation is safe to ignore).
 * Call when the user completes a milestone day for their program.
 */
export async function recordUserMilestone(
  userId: string,
  programType: ProgramType,
  milestoneDay: number,
  options?: {
    milestoneName?: string | null
    analyticsSnapshot?: Record<string, unknown> | null
  },
): Promise<boolean> {
  if (!isMilestoneDay(programType, milestoneDay)) return false

  const payload: Record<string, unknown> = {
    user_id: userId,
    program_type: programType,
    milestone_day: milestoneDay,
    milestone_name: options?.milestoneName ?? null,
  }
  if (options?.analyticsSnapshot != null) {
    payload.analytics_snapshot = options.analyticsSnapshot
  }

  const { error } = await supabase.from('user_milestones').insert(payload)

  if (error) {
    if (error.code === '23505') return true
    console.error('recordUserMilestone:', error)
    return false
  }
  return true
}
