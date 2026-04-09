import { createServiceRoleClient } from '@/lib/supabase-service'

export async function applyReferralRewardForUpgradedUser(
  upgradedUserId: string,
) {
  const admin = createServiceRoleClient()
  const { data: upgraded } = await admin
    .from('users')
    .select('id,referred_by')
    .eq('id', upgradedUserId)
    .maybeSingle()

  const referredBy = (upgraded as { referred_by?: string | null } | null)?.referred_by
  if (!referredBy) return { applied: false, reason: 'no_referrer' as const }

  const { data: referrer } = await admin
    .from('users')
    .select('id,plan,is_pro,subscription_end_date,referral_reward_months')
    .eq('referral_code', referredBy)
    .maybeSingle()

  if (!referrer) return { applied: false, reason: 'referrer_missing' as const }

  const { data: existing } = await admin
    .from('referral_events')
    .select('id,reward_applied')
    .eq('referrer_user_id', (referrer as { id: string }).id)
    .eq('referred_user_id', upgradedUserId)
    .maybeSingle()

  if (!existing || (existing as { reward_applied?: boolean }).reward_applied) {
    return { applied: false, reason: 'event_missing_or_already_applied' as const }
  }

  const r = referrer as {
    id: string
    plan: string
    is_pro: boolean
    subscription_end_date: string | null
    referral_reward_months?: number
  }

  if (r.plan === 'lifetime') {
    await admin
      .from('referral_events')
      .update({ reward_applied: true })
      .eq('id', (existing as { id: string }).id)
    return { applied: false, reason: 'lifetime_no_reward' as const, referrerId: r.id }
  }

  const now = Date.now()
  const currentEnd = r.subscription_end_date ? Date.parse(r.subscription_end_date) : 0
  const base = Number.isFinite(currentEnd) && currentEnd > now ? currentEnd : now
  const nextEndIso = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString()

  await admin
    .from('users')
    .update({
      is_pro: true,
      subscription_end_date: nextEndIso,
      referral_reward_months: (r.referral_reward_months ?? 0) + 1,
    })
    .eq('id', r.id)

  await admin
    .from('referral_events')
    .update({ reward_applied: true })
    .eq('id', (existing as { id: string }).id)

  return { applied: true, referrerId: r.id, subscription_end_date: nextEndIso }
}

