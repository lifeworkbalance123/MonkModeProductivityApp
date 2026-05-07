import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { sendPaymentConfirmationEmail } from '@/lib/email'
import { applyReferralRewardForUpgradedUser } from '@/lib/referral'
import { enrollProgramForUser } from '@/lib/programUtils'
import { STRIPE_PRICES } from '@/lib/stripePrices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const APP_SUBSCRIPTION_PRICE_IDS = new Set(
  [STRIPE_PRICES.APP_MONTHLY, STRIPE_PRICES.APP_ANNUAL].filter(Boolean),
)

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

        if (
          metaPlan === 'v2_program' ||
          metaPlan === 'monk_mode' ||
          metaPlan === 'sprint' ||
          metaPlan === 'transform'
        ) {
          const enrolled = await enrollProgramForUser(admin, userId)
          if (enrolled) {
            console.log(`User enrolled in ${metaPlan || 'program'}:`, userId)
          } else {
            console.error(`Program enrollment failed (${metaPlan || 'unknown'}) for user:`, userId)
          }
          const nowIso = new Date().toISOString()
          const { error: upProgErr } = await admin
            .from('user_programs')
            .update({
              payment_status: 'paid',
              trial_end: null,
              updated_at: nowIso,
            })
            .eq('user_id', userId)
          if (upProgErr) {
            console.warn('user_programs paid update after program checkout:', upProgErr.message)
          }
          await logWebhook(admin, eventType, eventId, userId, enrolled)
          break
        }

        if (metaPlan === 'coaching') {
          const { error } = await admin
            .from('users')
            .update({
              stripe_customer_id: customerId,
            })
            .eq('id', userId)
          await logWebhook(admin, eventType, eventId, userId, !error)
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
              cancellation_date: null,
              winback_email_sent: false,
            })
            .eq('id', userId)
          if (!error) {
            try {
              await applyReferralRewardForUpgradedUser(userId)
            } catch {
              // ignore referral reward failures
            }
            const email =
              session.customer_details?.email ??
              session.customer_email ??
              null
            if (email) {
              try {
                const { data: u } = await admin
                  .from('users')
                  .select('first_name')
                  .eq('id', userId)
                  .maybeSingle()
                const amountCents =
                  typeof session.amount_total === 'number'
                    ? session.amount_total
                    : typeof session.amount_subtotal === 'number'
                      ? session.amount_subtotal
                      : null
                const amount = amountCents
                  ? `$${(amountCents / 100).toFixed(2)}`
                  : '$149.00'
                await sendPaymentConfirmationEmail(
                  email,
                  (u as { first_name?: string | null } | null)?.first_name ??
                    null,
                  'Lifetime',
                  amount,
                  null,
                )
              } catch {
                // ignore email failures
              }
            }
          }
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

        const planForDb = metaPlan === 'annual' ? 'annual' : 'monthly'
        const { error } = await admin
          .from('users')
          .update({
            is_pro: true,
            plan: planForDb,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_end_date: periodEnd,
              cancellation_date: null,
              winback_email_sent: false,
          })
          .eq('id', userId)

        if (!error) {
          try {
            await applyReferralRewardForUpgradedUser(userId)
          } catch {
            // ignore referral reward failures
          }
          const email =
            session.customer_details?.email ??
            session.customer_email ??
            null
          if (email) {
            try {
              const { data: u } = await admin
                .from('users')
                .select('first_name')
                .eq('id', userId)
                .maybeSingle()

              let invoiceUrl: string | null = null
              const invoiceId =
                typeof session.invoice === 'string' ? session.invoice : null
              if (invoiceId) {
                try {
                  const inv = await stripe.invoices.retrieve(invoiceId)
                  invoiceUrl = inv.hosted_invoice_url ?? null
                } catch {
                  invoiceUrl = null
                }
              }

              const amountCents =
                typeof session.amount_total === 'number'
                  ? session.amount_total
                  : typeof session.amount_subtotal === 'number'
                    ? session.amount_subtotal
                    : null
              const amount = amountCents ? `$${(amountCents / 100).toFixed(2)}` : '$0.00'

              await sendPaymentConfirmationEmail(
                email,
                (u as { first_name?: string | null } | null)?.first_name ?? null,
                planForDb === 'annual' ? 'Pro Annual' : 'Pro Monthly',
                amount,
                invoiceUrl,
              )
            } catch {
              // ignore email failures
            }
          }
        }

        await logWebhook(admin, eventType, eventId, userId, !error)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const hasAppSubscriptionPrice = sub.items.data.some(
          (item) => !!item.price?.id && APP_SUBSCRIPTION_PRICE_IDS.has(item.price.id),
        )
        if (!hasAppSubscriptionPrice) {
          await logWebhook(admin, eventType, eventId, null, true)
          break
        }
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
              plan:
                sub.items.data[0]?.price?.recurring?.interval === 'year'
                  ? 'annual'
                  : 'monthly',
              stripe_subscription_id: sub.id,
              subscription_end_date: periodEnd,
              cancellation_date: null,
              winback_email_sent: false,
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
              cancellation_date: new Date().toISOString(),
              winback_email_sent: false,
            })
            .eq('id', userId)
          await logWebhook(admin, eventType, eventId, userId, !error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const hasAppSubscriptionPrice = sub.items.data.some(
          (item) => !!item.price?.id && APP_SUBSCRIPTION_PRICE_IDS.has(item.price.id),
        )
        if (!hasAppSubscriptionPrice) {
          await logWebhook(admin, eventType, eventId, null, true)
          break
        }
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
            subscription_end_date: new Date().toISOString(),
            cancellation_date: new Date().toISOString(),
            winback_email_sent: false,
          })
          .eq('id', userId)

        await logWebhook(admin, eventType, eventId, userId, !error)
        break
      }

      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent
        if (pi.metadata?.purpose !== 'financial_stake') {
          await logWebhook(admin, eventType, eventId, null, true)
          break
        }
        const userId = pi.metadata?.supabase_user_id ?? null
        const programType = (pi.metadata?.program_type ?? '60day').trim() || '60day'
        if (!userId || !pi.id) {
          await logWebhook(admin, eventType, eventId, null, false)
          break
        }
        const amount =
          typeof pi.amount === 'number' ? pi.amount : Number(pi.amount_received ?? pi.amount ?? 0)
        if (!Number.isFinite(amount) || amount < 1) {
          await logWebhook(admin, eventType, eventId, userId, false)
          break
        }
        const { error } = await admin.from('financial_stakes').upsert(
          {
            user_id: userId,
            program_type: programType,
            amount,
            stripe_payment_intent_id: pi.id,
            status: 'pending',
          },
          { onConflict: 'stripe_payment_intent_id' },
        )
        await logWebhook(admin, eventType, eventId, userId, !error)
        break
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent
        if (pi.metadata?.purpose !== 'financial_stake' || !pi.id) {
          await logWebhook(admin, eventType, eventId, null, true)
          break
        }
        const userId = pi.metadata?.supabase_user_id ?? null
        const { error } = await admin
          .from('financial_stakes')
          .update({
            status: 'success',
            resolved_at: new Date().toISOString(),
            failure_reason: null,
          })
          .eq('stripe_payment_intent_id', pi.id)
          .eq('status', 'pending')
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
