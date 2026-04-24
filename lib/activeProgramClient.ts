import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programStatus'
import { isSelectedProgram } from '@/lib/onboardingProgramFlow'

/** Active row from `user_programs` (browser client; RLS applies). */
export type UserActiveProgram = {
  id: string
  program_type: ProgramType
  program_day: number
  phase: number
  status: string
}

/** Alias for docs / snippets that use `ActiveProgram`. */
export type ActiveProgram = UserActiveProgram

export async function getUserActiveProgram(userId: string): Promise<UserActiveProgram | null> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('id, program_type, program_day, phase, status')
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
  }
  if (!isSelectedProgram(row.program_type)) return null

  return {
    id: row.id,
    program_type: row.program_type,
    program_day: row.program_day ?? 1,
    phase: row.phase ?? 1,
    status: row.status,
  }
}

export async function userHasActiveProgram(userId: string): Promise<boolean> {
  const row = await getUserActiveProgram(userId)
  return row !== null
}

/** Alias for snippets that call `getActiveProgram(userId)`. */
export const getActiveProgram = getUserActiveProgram
