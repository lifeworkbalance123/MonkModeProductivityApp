import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Defensive backfill for environments where `handle_new_user` trigger is missing/outdated.
 * Ensures `public.users` has a row so FK writes (`user_program_intake`, `user_programs`) don't fail.
 */
export async function ensureUserRow(
  supabase: SupabaseClient,
  user: Pick<User, 'id' | 'email'>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? null,
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.error('ensureUserRow upsert users', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
