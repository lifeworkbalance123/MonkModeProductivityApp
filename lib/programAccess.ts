import type { SupabaseClient } from '@supabase/supabase-js'
import { isProgramTrialAccessValid } from '@/lib/programTrial'

/** Columns needed to evaluate trial/paid access on `user_programs`. */
export type ProgramAccessFields = {
  id: string
  payment_status?: string | null
  trial_end?: string | null
}

/**
 * Whether the user may use guided-program features for this row (paid, active trial, or legacy grandfathered).
 */
export function programRowAllowsAccess(row: ProgramAccessFields | null | undefined): boolean {
  if (!row) return false
  return isProgramTrialAccessValid({
    payment_status: row.payment_status,
    trial_end: row.trial_end,
  })
}

/**
 * Check access for a specific `user_programs` row (must belong to `userId`).
 * Use from API routes with the caller’s user-scoped Supabase client (RLS).
 */
export async function canAccessProgram(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('id, user_id, payment_status, trial_end')
    .eq('user_id', userId)
    .eq('id', programId)
    .maybeSingle()

  if (error || !data) return false
  const row = data as { user_id: string; payment_status?: string | null; trial_end?: string | null }
  if (row.user_id !== userId) return false

  return isProgramTrialAccessValid({
    payment_status: row.payment_status,
    trial_end: row.trial_end,
  })
}

/**
 * Active program row for access checks (single row per user in practice).
 */
export async function getActiveUserProgramForAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProgramAccessFields | null> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('id, payment_status, trial_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return null
  return data as ProgramAccessFields
}
