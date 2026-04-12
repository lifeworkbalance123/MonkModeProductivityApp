import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { getAppOrigin } from '@/lib/app-origin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type CheckoutPriceKind = 'monthly' | 'annual' | 'lifetime'

/**
 * Creates a Stripe Checkout Session.
 * - V2 program: POST JSON `{ "plan": "v2_program" }` — one-time payment (price from STRIPE_V2_PROGRAM_PRICE_ID).
 * - Pro / Lifetime: POST JSON `{ "priceKind": "monthly" | "annual" | "lifetime" }`.
 * Authorization: Bearer <Supabase access_token>
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let admin
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

  let body: { priceKind?: string; plan?: string }
  try {
    body = (await request.json()) as { priceKind?: string; plan?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const origin = getAppOrigin(request)
  const stripe = new Stripe(secret)

  if ((body.plan ?? '').toLowerCase() === 'v2_program') {
    const priceId =
      process.env.STRIPE_V2_PROGRAM_PRICE_ID?.trim() ||
      process.env.NEXT_PUBLIC_V2_PROGRAM_PRICE_ID?.trim()
    if (!priceId) {
      return NextResponse.json(
        { error: 'V2 program price not configured (STRIPE_V2_PROGRAM_PRICE_ID)' },
        { status: 503 },
      )
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=v2_program`,
        cancel_url: `${origin}/join`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_email: user.email ?? undefined,
        client_reference_id: user.id,
        metadata: {
          supabase_user_id: user.id,
          plan: 'v2_program',
        },
      })

      if (!session.url) {
        return NextResponse.json(
          { error: 'Checkout session missing URL' },
          { status: 500 },
        )
      }
      return NextResponse.json({ url: session.url })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  const kind = (body.priceKind ?? '').toLowerCase() as CheckoutPriceKind
  if (!['monthly', 'annual', 'lifetime'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid priceKind' }, { status: 400 })
  }

  const monthlyId =
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()
  const annualId =
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_PRO_ANNUAL?.trim()
  const lifetimeId =
    process.env.STRIPE_LIFETIME_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_LIFETIME?.trim()

  const priceId =
    kind === 'monthly'
      ? monthlyId
      : kind === 'annual'
        ? annualId
        : lifetimeId

  if (!priceId) {
    return NextResponse.json(
      { error: 'Price not configured for this plan' },
      { status: 503 },
    )
  }

  const isLifetime = kind === 'lifetime'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto' },
      payment_method_types: isLifetime ? undefined : ['card'],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        plan: isLifetime ? 'lifetime' : kind,
        ...(kind === 'annual'
          ? { billing_cycle: 'yearly', success_message: 'annual_checkout' }
          : {}),
      },
      subscription_data: isLifetime
        ? undefined
        : {
            trial_period_days: 0,
            metadata: {
              supabase_user_id: user.id,
              plan: kind,
            },
          },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Checkout session missing URL' },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
