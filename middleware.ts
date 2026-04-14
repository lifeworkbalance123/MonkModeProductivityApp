import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function truthyEnv(value: string | undefined): boolean {
  const v = value?.trim()
  return v === '1' || v?.toLowerCase() === 'true'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/debug')) {
    const allow =
      process.env.NEXT_PUBLIC_ALLOW_DEBUG_ROUTE === 'true' ||
      truthyEnv(process.env.ALLOW_ADMIN_DEBUG_GRANT)
    if (!allow) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' })
    }
  }

  if (pathname.startsWith('/api/debug')) {
    const allowApi =
      truthyEnv(process.env.ALLOW_ADMIN_DEBUG_GRANT) ||
      truthyEnv(process.env.ALLOW_TRIAL_DEBUG_UPSERT)
    if (!allowApi) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/debug', '/debug/:path*', '/api/debug', '/api/debug/:path*'],
}
