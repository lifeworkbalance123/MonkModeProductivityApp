import type { Session } from '@supabase/supabase-js'

/** URL hash from Supabase implicit recovery redirect: `#...&type=recovery&...` */
export function hashFragmentIndicatesRecovery(): boolean {
  if (typeof window === 'undefined') return false
  const raw = window.location.hash?.replace(/^#/, '') ?? ''
  if (!raw) return false
  try {
    return new URLSearchParams(raw).get('type') === 'recovery'
  } catch {
    return false
  }
}

function parseJwtPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = '='.repeat((4 - (b64.length % 4)) % 4)
    const json = atob(b64 + pad)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Password-reset links create a session whose JWT `amr` includes `{ method: "recovery" }`.
 * Same as magic-link style session until the user calls updateUser({ password }).
 */
export function sessionHasRecoveryAmr(session: Session | null): boolean {
  if (!session?.access_token) return false
  const payload = parseJwtPayload(session.access_token)
  const amr = payload?.amr
  if (!Array.isArray(amr)) return false
  return amr.some(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      'method' in e &&
      (e as { method: string }).method === 'recovery',
  )
}
