import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { applyReferralRewardForUpgradedUser } from '@/lib/referral'
import { sendReferralRewardEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.REFERRAL_REWARD_SECRET?.trim()
  if (secret) {
    const auth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (auth !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { upgradedUserId?: string }
  try {
    body = (await request.json()) as { upgradedUserId?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const upgradedUserId = (body.upgradedUserId ?? '').trim()
  if (!upgradedUserId) return NextResponse.json({ error: 'Missing upgradedUserId' }, { status: 400 })

  const result = await applyReferralRewardForUpgradedUser(upgradedUserId)

  if (result.referrerId) {
    const admin = createServiceRoleClient()
    const { data } = await admin
      .from('users')
      .select('email,first_name')
      .eq('id', result.referrerId)
      .maybeSingle()
    const email = (data as { email?: string | null } | null)?.email
    if (email) {
      try {
        await sendReferralRewardEmail(
          email,
          (data as { first_name?: string | null } | null)?.first_name ?? null,
        )
      } catch {
        // ignore email failures
      }
    }
  }

  return NextResponse.json({ ok: true, result })
}

