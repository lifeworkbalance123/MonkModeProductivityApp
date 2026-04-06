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
  return 'http://127.0.0.1:3000'
}
