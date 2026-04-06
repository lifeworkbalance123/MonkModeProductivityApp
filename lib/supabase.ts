import { createClient } from '@supabase/supabase-js'

// Placeholders allow `next build` / prerender without .env.local; set real values locally and in production.
const PLACEHOLDER_URL = 'https://placeholder.local.supabase.co'
const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || PLACEHOLDER_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || PLACEHOLDER_ANON_KEY

/** False when env vars are missing or still the build-time placeholders (magic link / auth will fail with “Failed to fetch”). */
export function isSupabaseConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return (
    url.length > 0 &&
    key.length > 0 &&
    url !== PLACEHOLDER_URL &&
    key !== PLACEHOLDER_ANON_KEY
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
