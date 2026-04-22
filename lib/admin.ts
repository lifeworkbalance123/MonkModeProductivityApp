import type { User } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '@/lib/supabase-service'

const DEFAULT_ADMIN_EMAILS = ['your-email@example.com', 'tester@monkcubed.com', 'admin@monkcubed.com']

function parseEmails(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,\n;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

function configuredAdminEmails(): string[] {
  const fromAdminEmails = parseEmails(process.env.ADMIN_EMAILS)
  const fromPublicFallback = parseEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS)
  const fromSingle = parseEmails(process.env.ADMIN_EMAIL)
  const merged = [...fromAdminEmails, ...fromPublicFallback, ...fromSingle]
  return merged.length > 0 ? Array.from(new Set(merged)) : DEFAULT_ADMIN_EMAILS
}

function hasAdminRole(user: User | null): boolean {
  if (!user) return false
  const appRole = (user.app_metadata?.role ?? '').toString().toLowerCase()
  if (appRole === 'admin') return true

  const appRoles = user.app_metadata?.roles
  if (Array.isArray(appRoles) && appRoles.some((r) => `${r}`.toLowerCase() === 'admin')) {
    return true
  }

  const userRole = (user.user_metadata?.role ?? '').toString().toLowerCase()
  if (userRole === 'admin') return true

  const userRoles = user.user_metadata?.roles
  if (Array.isArray(userRoles) && userRoles.some((r) => `${r}`.toLowerCase() === 'admin')) {
    return true
  }

  return false
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return configuredAdminEmails().includes(email.trim().toLowerCase())
}

export function isAdmin(user: User | null): boolean {
  return hasAdminRole(user) || isAdminEmail(user?.email)
}

function supabaseWithUserJwt(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * API helper: validates bearer token, confirms admin access, and returns user info.
 * Falls back to service-role token validation if anon token validation fails.
 */
export async function getAdminUser(req: Request): Promise<{
  user: User | null
  error: string | null
  status: number
}> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? ''
  if (!token) {
    return { user: null, error: 'Unauthorized', status: 401 }
  }

  let user: User | null = null

  try {
    const authClient = supabaseWithUserJwt(token)
    const { data, error } = await authClient.auth.getUser()
    if (!error) user = data.user ?? null
  } catch {
    // Try service-role fallback below.
  }

  if (!user) {
    try {
      const service = createServiceRoleClient()
      const { data, error } = await service.auth.getUser(token)
      if (!error) user = data.user ?? null
    } catch {
      return { user: null, error: 'Unauthorized', status: 401 }
    }
  }

  if (!user) {
    return { user: null, error: 'Unauthorized', status: 401 }
  }
  if (!isAdmin(user)) {
    return { user: null, error: 'Unauthorized', status: 403 }
  }

  return { user, error: null, status: 200 }
}
