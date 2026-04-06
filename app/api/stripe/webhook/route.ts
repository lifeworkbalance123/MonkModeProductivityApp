import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Stripe v22 types omit top-level current_period_end; runtime/API still expose it on items or legacy shape. */
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

async function logWebhook(
  admin: ReturnType<typeof createServiceRoleClient>,
  eventType: string,
  stripeEventId: string,
  userId: string | null,
  success: boolean,
) {
  await admin.from('webhook_logs').insert({
    event_type: eventType,
    stripe_event_id: stripeEventId,
    user_id: userId,
    success,
  })
}

export async function POST(request: Request) {
  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return new NextResponse('Misconfigured', { status: 500 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret || !stripeKey) {
    return new NextResponse('Stripe not configured', { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return new NextResponse('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  const eventId = event.id
  const eventType = event.type

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id ?? null
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null
        const metaPlan = (session.metadata?.plan ?? '').toLowerCase()

        if (!userId) {
          await logWebhook(admin, eventType, eventId, null, false)
          break
        }

        if (metaPlan === 'lifetime') {
          const { error } = await admin
            .from('users')
            .update({
              is_pro: true,
              plan: 'lifetime',
              stripe_customer_id: customerId,
              stripe_subscription_id: null,
              subscription_end_date: null,
            })
            .eq('id', userId)
          await logWebhook(admin, eventType, eventId, userId, !error)
          break
        }

        const subRef = session.subscription
        const subscriptionId =
          typeof subRef === 'string' ? subRef : subRef?.id ?? null

        let periodEnd: string | null = null
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const endUnix = subscriptionPeriodEndUnix(sub)
          if (endUnix) {
            periodEnd = new Date(endUnix * 1000).toISOString()
          }
        }

        const { error } = await admin
          .from('users')
          .update({
            is_pro: true,
            plan: 'monthly',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_end_date: periodEnd,
          })
          .eq('id', userId)

        await logWebhook(admin, eventType, eventId, userId, !error)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string'
            ? sub.customer
            : sub.customer.id

        const { data: row, error: findErr } = await admin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        const userId = (row as { id: string } | null)?.id ?? null
        if (findErr || !userId) {
          await logWebhook(admin, eventType, eventId, userId, false)
          break
        }

        const active =
          sub.status === 'active' ||
          sub.status === 'trialing' ||
          sub.status === 'past_due'

        const endUnix = subscriptionPeriodEndUnix(sub)
        const periodEnd = endUnix
          ? new Date(endUnix * 1000).toISOString()
          : null

        if (active) {
          const { error } = await admin
            .from('users')
            .update({
              is_pro: true,
              plan: 'monthly',
              stripe_subscription_id: sub.id,
              subscription_end_date: periodEnd,
            })
            .eq('id', userId)
          await logWebhook(admin, eventType, eventId, userId, !error)
        } else {
          const { error } = await admin
            .from('users')
            .update({
              is_pro: false,
              plan: 'free',
              stripe_subscription_id: null,
              subscription_end_date: null,
            })
            .eq('id', userId)
          await logWebhook(admin, eventType, eventId, userId, !error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string'
            ? sub.customer
            : sub.customer.id

        const { data: row, error: findErr } = await admin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        const userId = (row as { id: string } | null)?.id ?? null
        if (findErr || !userId) {
          await logWebhook(admin, eventType, eventId, userId, false)
          break
        }

        const { error } = await admin
          .from('users')
          .update({
            is_pro: false,
            plan: 'free',
            stripe_subscription_id: null,
            subscription_end_date: null,
          })
          .eq('id', userId)

        await logWebhook(admin, eventType, eventId, userId, !error)
        break
      }

      default:
        await logWebhook(admin, eventType, eventId, null, true)
    }
  } catch {
    await logWebhook(admin, eventType, eventId, null, false)
    return new NextResponse('Handler error', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
