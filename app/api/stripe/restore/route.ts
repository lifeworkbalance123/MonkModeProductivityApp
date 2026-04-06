import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function subscriptionPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const ends =
    sub.items?.data
      ?.map((i) => i.current_period_end)
      .filter((n): n is number => typeof n === 'number' && n > 0) ?? []
  if (ends.length > 0) {
    return Math.max(...ends)
  }
  const legacy = sub as Stripe.Subscription & { current_period_end?: number }
  return legacy.current_period_end ?? null
}

async function findActiveMonthlySubscription(
  stripe: Stripe,
  customerId: string,
  monthlyPriceId: string,
): Promise<Stripe.Subscription | null> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 40,
  })
  const activeStatuses = new Set(['active', 'trialing', 'past_due'])
  for (const sub of subs.data) {
    if (!activeStatuses.has(sub.status)) continue
    for (const item of sub.items.data) {
      if (item.price.id === monthlyPriceId) return sub
    }
  }
  return null
}

async function hasPaidLifetimeForPrice(
  stripe: Stripe,
  customerId: string,
  lifetimePriceId: string,
): Promise<boolean> {
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 100,
  })
  for (const s of sessions.data) {
    if (s.mode !== 'payment' || s.payment_status !== 'paid') continue
    const items = await stripe.checkout.sessions.listLineItems(s.id, {
      limit: 25,
    })
    for (const li of items.data) {
      if (li.price?.id === lifetimePriceId) return true
    }
  }
  return false
}

/**
 * Reconcile Supabase entitlements with Stripe for the signed-in user's email.
 * POST. Authorization: Bearer <access_token>
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  const monthlyPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()
  const lifetimePriceId = process.env.STRIPE_PRICE_LIFETIME?.trim()

  if (!secret || !monthlyPriceId || !lifetimePriceId) {
    return NextResponse.json(
      { restored: false, error: 'Billing is not fully configured' },
      { status: 503 },
    )
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { restored: false, error: 'Server misconfigured' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ restored: false, error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user?.id) {
    return NextResponse.json({ restored: false, error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json(
      { restored: false, error: 'Your account has no email; cannot match purchases.' },
      { status: 400 },
    )
  }

  const stripe = new Stripe(secret)

  const customers = await stripe.customers.list({
    email,
    limit: 100,
  })

  if (customers.data.length === 0) {
    return NextResponse.json({ restored: false })
  }

  let winningCustomerId: string | null = null
  let plan: 'lifetime' | 'monthly' | null = null
  let subscriptionId: string | null = null
  let periodEndIso: string | null = null

  for (const cust of customers.data) {
    const lifetime = await hasPaidLifetimeForPrice(
      stripe,
      cust.id,
      lifetimePriceId,
    )
    if (lifetime) {
      winningCustomerId = cust.id
      plan = 'lifetime'
      subscriptionId = null
      periodEndIso = null
      break
    }
  }

  if (!plan) {
    for (const cust of customers.data) {
      const sub = await findActiveMonthlySubscription(
        stripe,
        cust.id,
        monthlyPriceId,
      )
      if (sub) {
        winningCustomerId = cust.id
        plan = 'monthly'
        subscriptionId = sub.id
        const endUnix = subscriptionPeriodEndUnix(sub)
        periodEndIso = endUnix
          ? new Date(endUnix * 1000).toISOString()
          : null
        break
      }
    }
  }

  if (!plan || !winningCustomerId) {
    return NextResponse.json({ restored: false })
  }

  const updatePayload =
    plan === 'lifetime'
      ? {
          is_pro: true,
          plan: 'lifetime' as const,
          stripe_customer_id: winningCustomerId,
          stripe_subscription_id: null as string | null,
          subscription_end_date: null as string | null,
        }
      : {
          is_pro: true,
          plan: 'monthly' as const,
          stripe_customer_id: winningCustomerId,
          stripe_subscription_id: subscriptionId,
          subscription_end_date: periodEndIso,
        }

  const { error: upErr } = await admin.from('users').update(updatePayload).eq('id', user.id)

  if (upErr) {
    console.error('restore update users', upErr)
    return NextResponse.json(
      { restored: false, error: 'Could not update your account' },
      { status: 500 },
    )
  }

  return NextResponse.json({ restored: true, plan })
}
