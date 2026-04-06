import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

/**
 * Dev/MVP: applies a paid plan using the service role after verifying the session.
 * Replace with Stripe Checkout completion in production.
 */
export async function POST(request: Request) {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = (body.plan ?? 'monthly').toLowerCase()
  const plan = raw === 'lifetime' ? 'lifetime' : 'monthly'

  const { error: upError } = await admin
    .from('users')
    .update({
      is_pro: true,
      plan,
    })
    .eq('id', user.id)

  if (upError) {
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, plan })
}
