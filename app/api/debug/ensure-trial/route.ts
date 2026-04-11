import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

function randomReferralCode(): string {
  const a = new Uint8Array(4)
  crypto.getRandomValues(a)
  const hex = Array.from(a, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 6)
  return `MM${hex}`
}

/**
 * Dev / staging: force the current user into an active 14-day Pro trial row.
 * Requires NODE_ENV=development OR ALLOW_TRIAL_DEBUG_UPSERT=1 on the server.
 */
export async function POST(request: Request) {
  const allowed =
    process.env.NODE_ENV === 'development' ||
    process.env.ALLOW_TRIAL_DEBUG_UPSERT === '1'
  if (!allowed) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

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

  const start = new Date()
  const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const createdAt = user.created_at
    ? new Date(user.created_at).toISOString()
    : start.toISOString()

  let referralCode = randomReferralCode()
  for (let i = 0; i < 8; i++) {
    const { data: clash } = await admin
      .from('users')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle()
    if (!clash) break
    referralCode = randomReferralCode()
  }

  const { data: existing } = await admin
    .from('users')
    .select('id, referral_code')
    .eq('id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await admin
        .from('users')
        .update({
          email: user.email ?? '',
          is_pro: false,
          plan: 'trial',
          trial_start_date: start.toISOString(),
          trial_end_date: end.toISOString(),
          is_trial_active: true,
        })
        .eq('id', user.id)
    : await admin.from('users').insert({
        id: user.id,
        email: user.email ?? '',
        is_pro: false,
        plan: 'trial',
        trial_start_date: start.toISOString(),
        trial_end_date: end.toISOString(),
        is_trial_active: true,
        created_at: createdAt,
        referral_code: referralCode,
      })

  if (error) {
    console.error('ensure-trial', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
