import { supabase } from '@/lib/supabase'

export const BUDDY_LOGGING_DAYS_REQUIRED = 7

export type BuddyPairStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type BuddyPairRow = {
  id: string
  inviter_user_id: string
  invitee_user_id: string | null
  invite_code: string
  status: BuddyPairStatus
  both_completed_7_days: boolean
  discount_applied: boolean
  inviter_discount_applied: boolean
  invitee_discount_applied: boolean
  discount_amount: number
  created_at: string
  activated_at: string | null
  completed_at: string | null
}

/** Client: refresh 7-day eligibility for the signed-in user’s active pair (call after completing a day). */
export async function refreshBuddyPairEligibility(): Promise<void> {
  const { error } = await supabase.rpc('refresh_buddy_pair_eligibility')
  if (error) {
    console.warn('refresh_buddy_pair_eligibility:', error.message)
  }
}

/** Active buddy’s user id, or null if pending / no pair. */
export function getBuddyPartnerUserId(pair: BuddyPairRow, myUserId: string): string | null {
  if (!pair.invitee_user_id) return null
  if (pair.inviter_user_id === myUserId) return pair.invitee_user_id
  if (pair.invitee_user_id === myUserId) return pair.inviter_user_id
  return null
}

export async function fetchMyBuddyPair(): Promise<BuddyPairRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('buddy_pairs')
    .select('*')
    .or(`inviter_user_id.eq.${user.id},invitee_user_id.eq.${user.id}`)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as BuddyPairRow
}
