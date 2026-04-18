import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programUtils'

export type CoachSessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type CoachBillingType = 'one_time' | 'subscription'

export type CoachSessionRow = {
  id: string
  user_id: string
  program_type: ProgramType | null
  calendly_event_uuid: string | null
  calendly_invitee_uri: string | null
  scheduled_at: string | null
  status: CoachSessionStatus
  notes: string | null
  billing_type: CoachBillingType | null
  stripe_checkout_session_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export async function fetchMyCoachSessions(limit = 20): Promise<CoachSessionRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []
  return data as CoachSessionRow[]
}
