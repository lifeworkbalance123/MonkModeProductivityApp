import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { getAppOrigin } from '@/lib/app-origin'
import type { ProgramType } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Body = {
  billing?: 'one_time' | 'weekly'
  programType?: string
}

/**
 * Stripe Checkout for optional coaching add-on (one-time pack or weekly subscription).
 * Set STRIPE_COACHING_ONE_TIME_PRICE_ID and/or STRIPE_COACHING_WEEKLY_PRICE_ID in env.
 * After payment, user books via NEXT_PUBLIC_CALENDLY_URL (see /api/coach/config).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
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

  const billing = (body.billing ?? 'weekly').toLowerCase() as 'one_time' | 'weekly'
  if (billing !== 'one_time' && billing !== 'weekly') {
    return NextResponse.json({ error: 'billing must be one_time or weekly' }, { status: 400 })
  }

  const programType = (body.programType ?? '60day') as ProgramType
  const valid: ProgramType[] = [
    '60day',
    'sprint_standard',
    'sprint_monk',
    'transform',
    'mastery',
  ]
  if (!valid.includes(programType)) {
    return NextResponse.json({ error: 'Invalid programType' }, { status: 400 })
  }

  const priceIdOne =
    process.env.STRIPE_COACHING_ONE_TIME_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_COACHING_ONE_TIME?.trim()
  const priceIdWeekly =
    process.env.STRIPE_COACHING_WEEKLY_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_COACHING_WEEKLY?.trim()

  const priceId = billing === 'one_time' ? priceIdOne : priceIdWeekly
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          billing === 'one_time'
            ? 'STRIPE_COACHING_ONE_TIME_PRICE_ID not configured'
            : 'STRIPE_COACHING_WEEKLY_PRICE_ID not configured',
      },
      { status: 503 },
    )
  }

  const origin = getAppOrigin(request)
  const stripe = new Stripe(secret)
  const mode = billing === 'weekly' ? 'subscription' : 'payment'

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/coach?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/coach?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        plan: 'coaching',
        coaching_billing: billing,
        program_type: programType,
      },
      subscription_data:
        mode === 'subscription'
          ? {
              metadata: {
                supabase_user_id: user.id,
                plan: 'coaching',
                coaching_billing: billing,
                program_type: programType,
              },
            }
          : undefined,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout session missing URL' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
