import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

const MS_PER_DAY = 24 * 60 * 60 * 1000

type UserEntitlementRow = {
  is_pro: boolean
  plan: string
  subscription_end_date: string | null
  created_at: string | null
  cancellation_date: string | null
  trial_end_date: string | null
  trial_start_date: string | null
  is_trial_active: boolean | null
}

function trialEndMs(row: UserEntitlementRow | null, authCreatedAt?: string | null): number | null {
  if (row?.trial_end_date) {
    const t = Date.parse(row.trial_end_date)
    return Number.isFinite(t) ? t : null
  }
  const base = row?.created_at ?? authCreatedAt
  if (!base) return null
  const start = Date.parse(base)
  if (!Number.isFinite(start)) return null
  return start + 14 * MS_PER_DAY
}

function paidPlan(plan: string): boolean {
  return plan === 'monthly' || plan === 'annual' || plan === 'lifetime'
}

/**
 * Returns verified billing state from the database (never from the client).
 * Active 14-day trial counts as Pro (plan `trial` or `free` within trial window).
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
    .select(
      'is_pro, plan, subscription_end_date, created_at, cancellation_date, trial_end_date, trial_start_date, is_trial_active',
    )
    .eq('id', user.id)
    .maybeSingle()

  if (rowError) {
    return NextResponse.json(
      { error: 'Failed to load entitlement' },
      { status: 500 },
    )
  }

  const r = row as UserEntitlementRow | null
  const authCreated = user.created_at ?? null
  const endMs = trialEndMs(r, authCreated)
  const now = Date.now()
  const inTrialWindow = endMs != null && now < endMs

  if (!r) {
    const isTrial = inTrialWindow
    const trialEndIso = endMs != null ? new Date(endMs).toISOString() : null
    return NextResponse.json({
      isPro: isTrial,
      plan: isTrial ? 'trial' : 'free',
      subscriptionEndDate: null,
      trialEndDate: trialEndIso,
      isTrial,
      cancellationDate: null,
    })
  }

  const planRaw = (r.plan ?? 'free').toLowerCase()
  const plan = ['free', 'trial', 'monthly', 'annual', 'lifetime'].includes(planRaw)
    ? planRaw
    : 'free'

  const isPaidPro =
    r.is_pro === true || paidPlan(plan)

  const trialEligible =
    (plan === 'free' || plan === 'trial') &&
    (r.is_trial_active !== false)

  const isTrial = !isPaidPro && trialEligible && inTrialWindow

  const isPro = isPaidPro || isTrial

  const trialEndDate =
    endMs != null ? new Date(endMs).toISOString() : null

  return NextResponse.json({
    isPro,
    plan,
    subscriptionEndDate: r.subscription_end_date,
    trialEndDate,
    isTrial,
    cancellationDate: r.cancellation_date,
  })
}
