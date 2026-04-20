import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { getAppOrigin } from '@/lib/app-origin'
import { getStripeClient } from '@/lib/stripe'
import { STRIPE_PRICES, isSubscriptionPrice } from '@/lib/stripePrices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type CheckoutPriceKind = 'monthly' | 'annual' | 'lifetime'
export type CheckoutMode = 'subscription' | 'payment'

/**
 * Creates a Stripe Checkout Session.
 * - Program: POST JSON `{ "plan": "monk_mode" | "sprint" | "transform" | "v2_program" }` — one-time payment.
 * - Pro / Lifetime: POST JSON `{ "priceKind": "monthly" | "annual" | "lifetime" }`.
 * Authorization: Bearer <Supabase access_token>
 */
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
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

  let body: {
    priceKind?: string
    plan?: string
    priceId?: string
    userId?: string
    userEmail?: string
    mode?: CheckoutMode
  }
  try {
    body = (await request.json()) as { priceKind?: string; plan?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const origin = getAppOrigin(request)
  const stripe = getStripeClient()

  // Optional direct price checkout (for Stripe.js / Checkout Session ID flows).
  if (body.priceId?.trim()) {
    const suppliedUserId = body.userId?.trim()
    if (suppliedUserId && suppliedUserId !== user.id) {
      return NextResponse.json({ error: 'Invalid userId for authenticated user' }, { status: 403 })
    }

    const priceId = body.priceId.trim()
    const explicitMode = body.mode
    const mode: CheckoutMode =
      explicitMode === 'payment' || explicitMode === 'subscription'
        ? explicitMode
        : isSubscriptionPrice(priceId)
          ? 'subscription'
          : 'payment'

    try {
      const session = await stripe.checkout.sessions.create({
        mode,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        customer_email: body.userEmail?.trim() || user.email || undefined,
        client_reference_id: user.id,
        metadata: {
          supabase_user_id: user.id,
          user_id: user.id,
        },
      })

      return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  const requestedPlan = (body.plan ?? '').toLowerCase()
  if (requestedPlan === 'v2_program' || requestedPlan === 'monk_mode' || requestedPlan === 'sprint' || requestedPlan === 'transform') {
    const programPlan =
      requestedPlan === 'v2_program' ? 'monk_mode' : requestedPlan
    const priceId =
      programPlan === 'sprint'
        ? STRIPE_PRICES.SPRINT
        : programPlan === 'transform'
          ? STRIPE_PRICES.TRANSFORM
          : STRIPE_PRICES.MONK_MODE
    if (!priceId) {
      return NextResponse.json(
        { error: `Program price not configured for ${programPlan}` },
        { status: 503 },
      )
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(programPlan)}`,
        cancel_url: `${origin}/join`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_email: user.email ?? undefined,
        client_reference_id: user.id,
        metadata: {
          supabase_user_id: user.id,
          plan: programPlan,
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

  const monthlyId = STRIPE_PRICES.APP_MONTHLY
  const annualId = STRIPE_PRICES.APP_ANNUAL
  const lifetimeId = STRIPE_PRICES.LIFETIME

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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscriptionPrice(priceId) ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto' },
      payment_method_types: kind === 'lifetime' ? undefined : ['card'],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        plan: kind === 'lifetime' ? 'lifetime' : kind,
        ...(kind === 'annual'
          ? { billing_cycle: 'yearly', success_message: 'annual_checkout' }
          : {}),
      },
      subscription_data: kind === 'lifetime'
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
