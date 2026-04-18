import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAdmin, insertAdminAudit } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin, adminUserId } = gate

  const { userId } = await ctx.params
  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let body: { amountCents?: number; reason?: string }
  try {
    body = (await request.json()) as { amountCents?: number; reason?: string }
  } catch {
    body = {}
  }

  const { data: u, error: uErr } = await admin
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (uErr || !u) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const customerId = (u as { stripe_customer_id?: string | null }).stripe_customer_id?.trim()
  if (!customerId) {
    return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 400 })
  }

  const stripe = new Stripe(secret)

  const charges = await stripe.charges.list({
    customer: customerId,
    limit: 10,
  })

  const paid = charges.data.filter((c) => c.status === 'succeeded' && !c.refunded)
  const charge = paid[0]
  if (!charge?.id) {
    return NextResponse.json({ error: 'No refundable charge found' }, { status: 400 })
  }

  const amountCents = body.amountCents
  try {
    const refund = await stripe.refunds.create({
      charge: charge.id,
      ...(typeof amountCents === 'number' && amountCents > 0
        ? { amount: Math.min(amountCents, charge.amount) }
        : {}),
    })

    await insertAdminAudit(admin, {
      admin_user_id: adminUserId,
      target_user_id: userId,
      action: 'stripe_refund',
      details: {
        refund_id: refund.id,
        charge_id: charge.id,
        amount: refund.amount,
        reason: body.reason ?? null,
      },
    })

    return NextResponse.json({
      ok: true,
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
