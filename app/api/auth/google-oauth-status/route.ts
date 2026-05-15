import { type NextRequest, NextResponse } from 'next/server'
import { getAuthCallbackUrl, normalizePublicOriginUrl } from '@/lib/app-origin'
import { getTrimmedSupabaseAnonKey, getTrimmedSupabaseUrl } from '@/lib/supabase-env'

export const dynamic = 'force-dynamic'

function callbackUrlFromRequest(request: NextRequest): string {
  const proto = (request.headers.get('x-forwarded-proto') ?? 'https').split(',')[0]?.trim() || 'https'
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    ?.trim()
  if (!host) return getAuthCallbackUrl()
  const origin = normalizePublicOriginUrl(`${proto}://${host}`)
  if (!origin) return getAuthCallbackUrl()
  return `${origin}/auth/callback`
}

function isGoogleProviderDisabledMessage(text: string): boolean {
  const lower = text.toLowerCase()
  if (lower.includes('unsupported provider') && lower.includes('not enabled')) return true
  if (lower.includes('provider is not enabled')) return true
  if (lower.includes('provider') && lower.includes('not enabled') && lower.includes('google'))
    return true
  try {
    const j = JSON.parse(text) as { msg?: string; error_code?: string }
    const msg = (j.msg ?? '').toLowerCase()
    if (j.error_code === 'validation_failed' && msg.includes('provider') && msg.includes('enabled')) {
      return true
    }
  } catch {
    /* not JSON */
  }
  return false
}

/**
 * Optional override (e.g. hide Google until dashboard is ready):
 * - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` → always unavailable
 * - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` → always available (skip probe)
 */
export async function GET(request: NextRequest) {
  const flag = (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ?? '').trim().toLowerCase()
  if (flag === 'false') {
    return NextResponse.json({ googleSignInAvailable: false as const, source: 'env' })
  }
  if (flag === 'true') {
    return NextResponse.json({ googleSignInAvailable: true as const, source: 'env' })
  }

  const baseUrl = getTrimmedSupabaseUrl().replace(/\/$/, '')
  const anon = getTrimmedSupabaseAnonKey()
  if (!baseUrl || !anon) {
    return NextResponse.json({ googleSignInAvailable: true as const, source: 'unknown' })
  }

  const redirectTo = callbackUrlFromRequest(request)
  const authorizeUrl = new URL(`${baseUrl}/auth/v1/authorize`)
  authorizeUrl.searchParams.set('provider', 'google')
  authorizeUrl.searchParams.set('redirect_to', redirectTo)

  try {
    const res = await fetch(authorizeUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      cache: 'no-store',
    })

    const loc = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && loc) {
      if (loc.includes('accounts.google.com') || loc.includes('google.com/o/oauth2')) {
        return NextResponse.json({ googleSignInAvailable: true as const, source: 'probe' })
      }
    }

    if (res.status === 400) {
      const text = await res.text()
      if (isGoogleProviderDisabledMessage(text)) {
        return NextResponse.json({ googleSignInAvailable: false as const, source: 'probe' })
      }
    }
  } catch {
    /* treat as unknown */
  }

  return NextResponse.json({ googleSignInAvailable: true as const, source: 'unknown' })
}
