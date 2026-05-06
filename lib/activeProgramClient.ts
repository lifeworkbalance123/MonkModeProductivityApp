import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programStatus'
import { isSelectedProgram } from '@/lib/onboardingProgramFlow'
import { programRowAllowsAccess } from '@/lib/programAccess'

/** Active row from `user_programs` (browser client; RLS applies). */
export type UserActiveProgram = {
  id: string
  program_type: ProgramType
  program_day: number
  phase: number
  status: string
  trial_end?: string | null
  payment_status?: string | null
}

/** Alias for docs / snippets that use `ActiveProgram`. */
export type ActiveProgram = UserActiveProgram

export async function getUserActiveProgram(userId: string): Promise<UserActiveProgram | null> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('id, program_type, program_day, phase, status, trial_end, payment_status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return null
  const row = data as {
    id: string
    program_type: string
    program_day: number | null
    phase: number | null
    status: string
    trial_end?: string | null
    payment_status?: string | null
  }
  if (!isSelectedProgram(row.program_type)) return null

  if (
    !programRowAllowsAccess({
      id: row.id,
      payment_status: row.payment_status,
      trial_end: row.trial_end,
    })
  ) {
    return null
  }

  return {
    id: row.id,
    program_type: row.program_type,
    program_day: row.program_day ?? 1,
    phase: row.phase ?? 1,
    status: row.status,
    trial_end: row.trial_end,
    payment_status: row.payment_status,
  }
}

/** Where onboarding should send the user based on `user_programs` trial/payment state. */
export async function getProgramEntryPath(
  userId: string,
): Promise<'onboard' | 'today' | 'join'> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('id, payment_status, trial_end, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return 'onboard'

  const row = data as {
    id: string
    payment_status?: string | null
    trial_end?: string | null
  }

  if (
    programRowAllowsAccess({
      id: row.id,
      payment_status: row.payment_status,
      trial_end: row.trial_end,
    })
  )
    return 'today'

  if ((row.payment_status ?? '').toLowerCase() === 'trial') {
    return 'join'
  }

  return 'today'
}

export async function userHasActiveProgram(userId: string): Promise<boolean> {
  const row = await getUserActiveProgram(userId)
  return row !== null
}

/** Alias for snippets that call `getActiveProgram(userId)`. */
export const getActiveProgram = getUserActiveProgram
