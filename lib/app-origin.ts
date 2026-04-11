/**
 * Public site origin for Stripe return URLs (portal, checkout).
 */
export function getAppOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (env) return env.replace(/\/$/, '')
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}

/**
 * Base URL for Supabase magic links and OAuth redirects.
 * Prefer NEXT_PUBLIC_SITE_URL (canonical public origin), then NEXT_PUBLIC_APP_URL.
 */
export function getAuthCallbackBaseUrl(): string {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (site) return site
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3000'
}

export function getAuthCallbackUrl(): string {
  const base = getAuthCallbackBaseUrl()
  return `${base}/auth/callback`
}
