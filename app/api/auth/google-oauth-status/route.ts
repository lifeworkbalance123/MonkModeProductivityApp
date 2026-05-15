import { NextResponse } from 'next/server'
import { getAuthCallbackUrl } from '@/lib/app-origin'
import { getTrimmedSupabaseAnonKey, getTrimmedSupabaseUrl } from '@/lib/supabase-env'

export const dynamic = 'force-dynamic'

/**
 * Optional override (e.g. hide Google until dashboard is ready):
 * - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` → always unavailable
 * - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` → always available (skip probe)
 */
export async function GET() {
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

  const redirectTo = getAuthCallbackUrl()
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
      const lower = text.toLowerCase()
      if (
        lower.includes('not enabled') ||
        lower.includes('unsupported provider') ||
        lower.includes('provider is not enabled')
      ) {
        return NextResponse.json({ googleSignInAvailable: false as const, source: 'probe' })
      }
    }
  } catch {
    /* treat as unknown */
  }

  return NextResponse.json({ googleSignInAvailable: true as const, source: 'unknown' })
}
