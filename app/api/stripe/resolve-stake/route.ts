import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Body = {
  stakeId?: string
  action?: 'release' | 'capture'
  failureReason?: string
}

/**
 * After weekly evaluation: release authorization (cancel PI) or capture forfeiture.
 * Caller: authenticated stake owner, or cron with Authorization: Bearer CRON_SECRET.
 */
export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? ''

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const stakeId = body.stakeId
  const action = body.action
  if (!stakeId || (action !== 'release' && action !== 'capture')) {
    return NextResponse.json(
      { error: 'stakeId and action (release|capture) required' },
      { status: 400 },
    )
  }

  let userId: string | null = null
  const isCron = cronSecret && bearer === cronSecret

  if (isCron) {
    const { data: row } = await admin
      .from('financial_stakes')
      .select('user_id')
      .eq('id', stakeId)
      .maybeSingle()
    userId = (row as { user_id?: string } | null)?.user_id ?? null
    if (!userId) {
      return NextResponse.json({ error: 'Stake not found' }, { status: 404 })
    }
  } else {
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(bearer)
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  }

  const { data: stake, error: fetchErr } = await admin
    .from('financial_stakes')
    .select('*')
    .eq('id', stakeId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()

  if (fetchErr || !stake) {
    return NextResponse.json({ error: 'Pending stake not found' }, { status: 404 })
  }

  const piId = (stake as { stripe_payment_intent_id: string }).stripe_payment_intent_id
  const stripe = new Stripe(stripeKey)
  const now = new Date().toISOString()

  try {
    if (action === 'release') {
      await stripe.paymentIntents.cancel(piId)
      const { error: updErr } = await admin
        .from('financial_stakes')
        .update({
          status: 'success',
          resolved_at: now,
          failure_reason: null,
        })
        .eq('id', stakeId)
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, outcome: 'released' })
    }

    await stripe.paymentIntents.capture(piId)
    const reason =
      (body.failureReason ?? '').trim() ||
      `Missed more than the allowed logging days in a week`
    const { error: updErr } = await admin
      .from('financial_stakes')
      .update({
        status: 'failed',
        resolved_at: now,
        failure_reason: reason,
      })
      .eq('id', stakeId)
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, outcome: 'captured' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Stripe error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
