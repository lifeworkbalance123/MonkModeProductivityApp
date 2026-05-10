import type { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { isAuthStorageLockError, withAuthStorageLockRetry } from '@/lib/authStorageLock'

/**
 * Sums `duration_minutes` for the signed-in user’s deep work rows for the **local calendar day**.
 * Prefer `session_date` over `created_at` so sessions align with program “today”.
 */
export async function fetchDeepWorkMinutesToday(supabase: SupabaseClient): Promise<number> {
  let userId: string | null = null
  try {
    const {
      data: { user },
    } = await withAuthStorageLockRetry(() => supabase.auth.getUser())
    userId = user?.id ?? null
  } catch (error) {
    if (!isAuthStorageLockError(error)) throw error
    const {
      data: { session },
    } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
    userId = session?.user?.id ?? null
  }

  if (!userId) return 0

  const day = format(new Date(), 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('deep_work_sessions')
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('session_date', day)

  if (error || !data?.length) return 0
  return data.reduce((acc, row) => acc + (Number((row as { duration_minutes?: number }).duration_minutes) || 0), 0)
}
