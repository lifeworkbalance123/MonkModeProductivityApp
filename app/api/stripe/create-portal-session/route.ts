import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { getAppOrigin } from '@/lib/app-origin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Stripe Customer Portal for subscription management.
 * POST. Authorization: Bearer <access_token>
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

  const { data: row, error: rowError } = await admin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (rowError) {
    return NextResponse.json({ error: 'Could not load billing profile' }, { status: 500 })
  }

  const customerId = (row as { stripe_customer_id?: string | null } | null)
    ?.stripe_customer_id

  if (!customerId?.trim()) {
    return NextResponse.json(
      { error: 'No Stripe customer on file for this account' },
      { status: 400 },
    )
  }

  const stripe = new Stripe(secret)
  const origin = getAppOrigin(request)
  const returnUrl = `${origin}/settings`

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('billingPortal.sessions.create', e)
    return NextResponse.json(
      { error: 'Could not open billing portal' },
      { status: 500 },
    )
  }
}
