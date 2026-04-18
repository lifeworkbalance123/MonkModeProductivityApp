import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Calendly webhook signing (HMAC SHA256, hex digest).
 * Header format: `t=1699564800,v1=hexdigest`
 * @see https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures
 */
export function verifyCalendlyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
): boolean {
  if (!signatureHeader?.trim() || !signingKey) return false
  const parts = signatureHeader.split(',').map((p) => p.trim())
  let ts = ''
  let v1 = ''
  for (const p of parts) {
    const eq = p.indexOf('=')
    if (eq === -1) continue
    const k = p.slice(0, eq)
    const v = p.slice(eq + 1)
    if (k === 't') ts = v
    if (k === 'v1') v1 = v
  }
  if (!ts || !v1) return false
  const signedPayload = `${ts}.${rawBody}`
  const expectedHex = createHmac('sha256', signingKey).update(signedPayload).digest('hex')
  try {
    const a = Buffer.from(v1, 'hex')
    const b = Buffer.from(expectedHex, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Pull UUID from Calendly resource URI (…/scheduled_events/{uuid}). */
export function extractCalendlyUuid(uri: string | undefined | null): string | null {
  if (!uri) return null
  const m = uri.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return m ? m[0] : null
}
