import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { bearerTokenFromRequest, createBearerSupabase } from '@/lib/supabaseBearer'

/**
 * Session for App Router API routes: valid Bearer JWT if present, else Supabase
 * cookies via `createServerSupabaseClient` (same role as
 * `createRouteHandlerClient({ cookies })` from `@supabase/auth-helpers-nextjs`).
 */
export async function resolveUserSupabase(
  request: Request,
): Promise<{ user: User; supabase: SupabaseClient } | { user: null; supabase: null }> {
  const token = bearerTokenFromRequest(request)
  if (token) {
    try {
      const supabase = createBearerSupabase(token)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.id) return { user, supabase }
    } catch {
      /* fall through to cookie session */
    }
  }
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) return { user, supabase }
  } catch {
    /* ignore */
  }
  return { user: null, supabase: null }
}
