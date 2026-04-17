/**
 * Public contact details and canonical site origin for monkcubed.
 * Use NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL in production (Vercel).
 */

export const SUPPORT_EMAIL = 'support@monkcubed.com' as const
export const SALES_EMAIL = 'sales@monkcubed.com' as const
export const APP_DISPLAY_NAME = 'monkcubed' as const
export const DEFAULT_PUBLIC_ORIGIN = 'https://monkcubed.com' as const

/**
 * Canonical public site base URL (no trailing slash).
 * Vercel env is often set to a bare host (`example.com`); `new URL()` requires a scheme,
 * so we prepend `https://` when missing (fixes build: metadataBase in app/layout.tsx).
 */
export function publicSiteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()) ?? ''
  if (!raw) return DEFAULT_PUBLIC_ORIGIN

  const candidate = /^https?:\/\//i.test(raw) ? raw.trim() : `https://${raw.trim()}`
  try {
    const u = new URL(candidate)
    const path = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')
    const tail = `${path}${u.search}${u.hash}`
    const base = `${u.origin}${tail}`
    return base.replace(/\/$/, '')
  } catch {
    return DEFAULT_PUBLIC_ORIGIN
  }
}

export function mailtoSupport(subject: string, body?: string): string {
  const q = new URLSearchParams({ subject })
  if (body) q.set('body', body)
  return `mailto:${SUPPORT_EMAIL}?${q.toString()}`
}

export function mailtoSales(subject: string, body?: string): string {
  const q = new URLSearchParams({ subject })
  if (body) q.set('body', body)
  return `mailto:${SALES_EMAIL}?${q.toString()}`
}
