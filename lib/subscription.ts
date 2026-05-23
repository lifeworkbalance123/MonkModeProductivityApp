import { supabase } from '@/lib/supabase'

/**
 * Client-side Pro check using the same `users.is_pro` field as `/api/user/entitlement`.
 * Respects RLS: only works for the signed-in user reading their own row.
 */
export async function isProUser(userId: string): Promise<boolean> {
  if (!userId) return false
  const { data, error } = await supabase
    .from('users')
    .select('is_pro')
    .eq('id', userId)
    .maybeSingle()
  if (error) return false
  return data?.is_pro === true
}
