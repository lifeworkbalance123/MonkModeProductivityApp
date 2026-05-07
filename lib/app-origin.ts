/** Fixes common typos like `http:///localhost:3000` (extra slash after scheme). */
export function normalizePublicOriginUrl(raw: string): string {
  const t = raw.trim().replace(/\/$/, '')
  if (!t) return ''
  // Collapse `http:////host` / `http:///host` → `http://host`
  const fixed = t.replace(/^(https?:)\/+/, (_, scheme: string) => `${scheme}//`)
  return fixed
}

/**
 * Public site origin for Stripe return URLs (portal, checkout).
 */
export function getAppOrigin(request: Request): string {
  const env = normalizePublicOriginUrl(process.env.NEXT_PUBLIC_APP_URL ?? '')
  if (env) return env
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
    return normalizePublicOriginUrl(window.location.origin)
  }
  const site =
    normalizePublicOriginUrl(process.env.NEXT_PUBLIC_SITE_URL ?? '') ||
    normalizePublicOriginUrl(process.env.NEXT_PUBLIC_APP_URL ?? '')
  if (site) return site
  return 'http://localhost:3000'
}

export function getAuthCallbackUrl(): string {
  const base = getAuthCallbackBaseUrl()
  return `${base}/auth/callback`
}
