/**
 * Split from `supabase.ts` so `lib/supabase-resilient-fetch.ts` can import without a cycle.
 */

export const BUILD_SAFE_URL = 'https://build-placeholder.supabase.co'
export const BUILD_SAFE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build-placeholder-not-for-production'

function trimmedEnvUrl(): string {
  const v = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  if (!v) return ''
  try {
    const u = new URL(v)
    if (u.protocol === 'https:' || u.protocol === 'http:') return v
  } catch {
    /* ignore */
  }
  return ''
}

function trimmedEnvKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
}

export function getTrimmedSupabaseUrl(): string {
  return trimmedEnvUrl()
}

export function getTrimmedSupabaseAnonKey(): string {
  return trimmedEnvKey()
}

function isPlaceholderLikeUrl(url: string): boolean {
  if (!url) return true
  const lower = url.toLowerCase()
  return (
    lower.includes('your_project') ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    url === BUILD_SAFE_URL
  )
}

function isPlaceholderLikeKey(key: string): boolean {
  if (!key) return true
  const lower = key.toLowerCase()
  return (
    lower.includes('your_anon') ||
    lower.includes('placeholder') ||
    key === BUILD_SAFE_ANON_KEY
  )
}

function looksLikeValidSupabaseApiUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol === 'https:') {
      if (u.hostname.endsWith('.supabase.co')) return true
      return u.hostname.includes('.')
    }
    return u.protocol === 'http:'
  } catch {
    return false
  }
}

function looksLikeSupabaseBrowserKey(key: string): boolean {
  if (key.startsWith('sb_publishable_') && key.length >= 24) return true
  if (key.length < 120) return false
  const parts = key.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

const rawUrl = trimmedEnvUrl()
const rawKey = trimmedEnvKey()

/**
 * If non-null, auth/API will not work until fixed. Uses real env values, not build placeholders.
 */
export function getSupabaseConfigProblem(): string | null {
  if (!rawUrl || !rawKey) {
    return 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local.'
  }
  if (isPlaceholderLikeUrl(rawUrl) || isPlaceholderLikeKey(rawKey)) {
    return (
      'Supabase env vars still look like placeholders (e.g. your_project_url). ' +
      'Open Supabase → Settings → API and paste the real Project URL and anon public key into .env.local, then restart npm run dev.'
    )
  }
  if (!looksLikeValidSupabaseApiUrl(rawUrl)) {
    return (
      'NEXT_PUBLIC_SUPABASE_URL must be a full https URL (e.g. https://xxxx.supabase.co from Supabase → Settings → API).'
    )
  }
  if (!looksLikeSupabaseBrowserKey(rawKey)) {
    return (
      'NEXT_PUBLIC_SUPABASE_ANON_KEY should be the publishable/anon client key from Supabase → Settings → API (sb_publishable_… or legacy eyJ… JWT), not the service_role secret.'
    )
  }
  return null
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigProblem() === null
}

export function getResolvedSupabaseUrl(): string {
  return rawUrl || BUILD_SAFE_URL
}

export function getResolvedSupabaseAnonKey(): string {
  return rawKey || BUILD_SAFE_ANON_KEY
}
