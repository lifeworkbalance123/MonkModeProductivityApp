/**
 * Public contact details and canonical site origin for monkcubed.
 * Use NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL in production (Vercel).
 */

export const SUPPORT_EMAIL = 'support@monkcubed.com' as const
export const SALES_EMAIL = 'sales@monkcubed.com' as const
export const APP_DISPLAY_NAME = 'monkcubed' as const
export const DEFAULT_PUBLIC_ORIGIN = 'https://monkcubed.com' as const

export function publicSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  return DEFAULT_PUBLIC_ORIGIN
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
