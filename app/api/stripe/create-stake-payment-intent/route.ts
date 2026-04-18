import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isAllowedStakeAmountCents } from '@/lib/financialStake'
import type { ProgramType } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Body = {
  amountCents?: number
  programType?: string
}

/**
 * Creates a PaymentIntent with manual capture for an optional financial stake.
 * Client confirms with Stripe.js; webhook records `financial_stakes` when authorized.
 */
export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
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
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const amountCents = body.amountCents
  const programType = (body.programType ?? '60day') as ProgramType

  if (typeof amountCents !== 'number' || !isAllowedStakeAmountCents(amountCents)) {
    return NextResponse.json(
      { error: 'amountCents must be one of 2500, 5000, or 10000' },
      { status: 400 },
    )
  }

  const validPrograms: ProgramType[] = [
    '60day',
    'sprint_standard',
    'sprint_monk',
    'transform',
    'mastery',
  ]
  if (!validPrograms.includes(programType)) {
    return NextResponse.json({ error: 'Invalid programType' }, { status: 400 })
  }

  const { data: pending } = await admin
    .from('financial_stakes')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (pending) {
    return NextResponse.json(
      { error: 'You already have a pending stake. Resolve it before creating another.' },
      { status: 409 },
    )
  }

  const { data: profile } = await admin
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .maybeSingle()

  const stripe = new Stripe(stripeKey)
  const customerId =
    (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null

  try {
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'manual',
      customer: customerId ?? undefined,
      receipt_email: (profile as { email?: string | null } | null)?.email ?? undefined,
      metadata: {
        purpose: 'financial_stake',
        supabase_user_id: user.id,
        program_type: programType,
        stake_amount_cents: String(amountCents),
      },
      automatic_payment_methods: { enabled: true },
    })

    if (!pi.client_secret) {
      return NextResponse.json({ error: 'PaymentIntent missing client_secret' }, { status: 500 })
    }

    return NextResponse.json({
      paymentIntentId: pi.id,
      clientSecret: pi.client_secret,
      amountCents,
      programType,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Stripe error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
