import { supabase } from '@/lib/supabase'

/** Program week index (1-based): days 1–7 → week 1, 8–14 → week 2, … */
export function programWeekFromDay(programDay: number): number {
  const d = Math.max(1, Math.floor(programDay))
  return Math.max(1, Math.ceil(d / 7))
}

export type BuddyCheckinRow = {
  id: string
  buddy_pair_id: string
  from_user_id: string
  to_user_id: string
  week_number: number
  message: string | null
  sent_at: string
  read_at: string | null
}

export async function sendBuddyCheckin(params: {
  buddyPairId: string
  toUserId: string
  weekNumber: number
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const trimmed = params.message.trim()
  if (!trimmed) return { ok: false, error: 'Message is empty' }

  const { error } = await supabase.from('buddy_checkins').insert({
    buddy_pair_id: params.buddyPairId,
    from_user_id: user.id,
    to_user_id: params.toUserId,
    week_number: params.weekNumber,
    message: trimmed,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
