import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

/**
 * Whether transactional email is configured on this deployment (no secrets exposed).
 */
export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response

  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim())
  const hasFrom = Boolean(process.env.EMAIL_FROM?.trim())
  const missing = [
    ...(!hasKey ? (['RESEND_API_KEY'] as const) : []),
    ...(!hasFrom ? (['EMAIL_FROM'] as const) : []),
  ]

  return NextResponse.json({
    configured: hasKey && hasFrom,
    missing,
  })
}
