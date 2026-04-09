import { createClient } from '@supabase/supabase-js'

// Placeholders allow `next build` / prerender without .env.local; set real values locally and in production.
const PLACEHOLDER_URL = 'https://placeholder.local.supabase.co'
const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || PLACEHOLDER_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || PLACEHOLDER_ANON_KEY

function isPlaceholderLikeUrl(url: string): boolean {
  if (!url) return true
  if (url === PLACEHOLDER_URL) return true
  const lower = url.toLowerCase()
  return (
    lower.includes('your_project') ||
    lower.includes('placeholder') ||
    lower.includes('example.com')
  )
}

function isPlaceholderLikeKey(key: string): boolean {
  if (!key) return true
  if (key === PLACEHOLDER_ANON_KEY) return true
  const lower = key.toLowerCase()
  return lower.includes('your_anon') || lower.includes('placeholder')
}

/** Cloud project or any https API origin (self-hosted). */
function looksLikeValidSupabaseApiUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    if (u.hostname.endsWith('.supabase.co')) return true
    return u.hostname.includes('.')
  } catch {
    return false
  }
}

/**
 * Browser-safe key: legacy anon JWT (eyJ… three segments) or newer publishable key (sb_publishable_…).
 * @see https://supabase.com/docs/guides/api/api-keys
 */
function looksLikeSupabaseBrowserKey(key: string): boolean {
  if (key.startsWith('sb_publishable_') && key.length >= 24) return true
  if (key.length < 120) return false
  const parts = key.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

/**
 * If non-null, auth will not work until fixed. More specific than a generic "network error"
 * (e.g. .env.example values like `your_project_url` pass a naive empty check but fail at runtime).
 */
export function getSupabaseConfigProblem(): string | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  if (!url || !key) {
    return 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local.'
  }
  if (isPlaceholderLikeUrl(url) || isPlaceholderLikeKey(key)) {
    return (
      'Supabase env vars still look like placeholders (e.g. your_project_url). ' +
      'Open Supabase → Settings → API and paste the real Project URL and anon public key into .env.local, then restart npm run dev.'
    )
  }
  if (!looksLikeValidSupabaseApiUrl(url)) {
    return (
      'NEXT_PUBLIC_SUPABASE_URL must be a full https URL (e.g. https://xxxx.supabase.co from Supabase → Settings → API).'
    )
  }
  if (!looksLikeSupabaseBrowserKey(key)) {
    return (
      'NEXT_PUBLIC_SUPABASE_ANON_KEY should be the publishable/anon client key from Supabase → Settings → API (sb_publishable_… or legacy eyJ… JWT), not the service_role secret.'
    )
  }
  return null
}

/** False when env vars are missing, placeholders, or do not look like a real Supabase project + anon JWT. */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigProblem() === null
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
