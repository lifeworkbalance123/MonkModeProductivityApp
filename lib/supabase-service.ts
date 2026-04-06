import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS — use only in API routes / server code, never in the browser.
 */
export function createServiceRoleClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
