import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { referralCode?: string }
  try {
    body = (await request.json()) as { referralCode?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = (body.referralCode ?? '').trim().toUpperCase()
  if (!code) return NextResponse.json({ ok: true, skipped: true })

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()
  const {
    data: { user },
  } = await admin.auth.getUser(token)

  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: referrer } = await admin
    .from('users')
    .select('id,referral_code')
    .eq('referral_code', code)
    .maybeSingle()

  if (!referrer) return NextResponse.json({ ok: true, skipped: true, reason: 'invalid_code' })
  if ((referrer as { id: string }).id === user.id) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'self_referral' })
  }

  const { data: existing } = await admin
    .from('users')
    .select('referred_by')
    .eq('id', user.id)
    .maybeSingle()
  if ((existing as { referred_by?: string | null } | null)?.referred_by) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already_referred' })
  }

  await admin
    .from('users')
    .update({ referred_by: code })
    .eq('id', user.id)

  await admin
    .from('referral_events')
    .upsert(
      {
        referrer_user_id: (referrer as { id: string }).id,
        referred_user_id: user.id,
        reward_applied: false,
      },
      { onConflict: 'referrer_user_id,referred_user_id' },
    )

  await admin.rpc('increment_referral_count', {
    p_user_id: (referrer as { id: string }).id,
  })

  return NextResponse.json({ ok: true })
}

