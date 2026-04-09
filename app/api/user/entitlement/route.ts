import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

type UserEntitlementRow = {
  is_pro: boolean
  plan: string
  subscription_end_date: string | null
  created_at: string | null
  cancellation_date: string | null
}

/**
 * Returns verified billing state from the database (never from the client).
 * Authorization: Bearer <Supabase access_token>
 */
export async function GET(request: Request) {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 503 },
    )
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

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: row, error: rowError } = await admin
    .from('users')
    .select('is_pro, plan, subscription_end_date, created_at, cancellation_date')
    .eq('id', user.id)
    .maybeSingle()

  if (rowError) {
    return NextResponse.json(
      { error: 'Failed to load entitlement' },
      { status: 500 },
    )
  }

  const r = row as UserEntitlementRow | null
  if (!r) {
    return NextResponse.json({
      isPro: false,
      plan: 'free',
      subscriptionEndDate: null,
    })
  }

  const plan = (r.plan ?? 'free').toLowerCase()
  const isPro =
    r.is_pro === true ||
    plan === 'monthly' ||
    plan === 'annual' ||
    plan === 'lifetime'

  const trialEndDate = r.created_at
    ? new Date(Date.parse(r.created_at) + 14 * 24 * 60 * 60 * 1000).toISOString()
    : null
  const isTrial =
    plan === 'free' &&
    !!trialEndDate &&
    Date.now() < Date.parse(trialEndDate)

  return NextResponse.json({
    isPro,
    plan: ['free', 'monthly', 'annual', 'lifetime'].includes(plan) ? plan : 'free',
    subscriptionEndDate: r.subscription_end_date,
    trialEndDate,
    isTrial,
    cancellationDate: r.cancellation_date,
  })
}
