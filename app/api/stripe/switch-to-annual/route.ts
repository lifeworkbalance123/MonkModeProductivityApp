import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  const annualPriceId =
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_PRO_ANNUAL?.trim()
  if (!stripeKey || !annualPriceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const admin = createServiceRoleClient()
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)
  if (authError || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: row } = await admin
    .from('users')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  const subscriptionId =
    (row as { stripe_subscription_id?: string | null } | null)
      ?.stripe_subscription_id ?? null
  if (!subscriptionId) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 },
    )
  }

  const stripe = new Stripe(stripeKey)
  const existing = await stripe.subscriptions.retrieve(subscriptionId)
  const item = existing.items.data[0]
  if (!item?.id) {
    return NextResponse.json(
      { error: 'Subscription item missing' },
      { status: 500 },
    )
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, price: annualPriceId }],
    proration_behavior: 'always_invoice',
    billing_cycle_anchor: 'unchanged',
  })

  const endUnix =
    updated.items.data
      ?.map((i) => i.current_period_end)
      .filter((n): n is number => typeof n === 'number' && n > 0)
      .reduce((a, b) => Math.max(a, b), 0) ?? null
  const renewalDate = endUnix ? new Date(endUnix * 1000).toISOString() : null

  await admin
    .from('users')
    .update({
      plan: 'annual',
      is_pro: true,
      subscription_end_date: renewalDate,
    })
    .eq('id', user.id)

  return NextResponse.json({ ok: true, renewalDate })
}

