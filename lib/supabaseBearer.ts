import { createClient } from '@supabase/supabase-js'

/** Anon Supabase client scoped to the caller’s JWT (RLS as that user). */
export function createBearerSupabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function bearerTokenFromRequest(request: Request): string | null {
  const h = request.headers.get('authorization')
  const t = h?.replace(/^Bearer\s+/i, '').trim()
  return t || null
}
