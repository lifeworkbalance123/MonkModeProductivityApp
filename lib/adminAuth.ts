import { createServiceRoleClient } from '@/lib/supabase-service'

/**
 * Server-only: verify `public.users.is_admin` for a Supabase auth user id.
 * Uses the service role (never call from the browser).
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return false
    return (data as { is_admin?: boolean }).is_admin === true
  } catch (err) {
    console.error('Admin check error:', err)
    return false
  }
}
