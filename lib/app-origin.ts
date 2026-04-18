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
 * Base URL for Supabase magic links, OAuth, and password-reset redirects.
 *
 * In the browser, the **current tab origin** wins so auth emails match where the
 * user actually signed in (avoids stale `NEXT_PUBLIC_SITE_URL` on Vercel pointing at
 * a removed domain). On the server / at build time, uses env then localhost.
 */
export function getAuthCallbackBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (site) return site
  return 'http://localhost:3000'
}

export function getAuthCallbackUrl(): string {
  const base = getAuthCallbackBaseUrl()
  return `${base}/auth/callback`
}
