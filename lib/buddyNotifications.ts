import { supabase } from '@/lib/supabase'

export type BuddyNotificationKind = 'partner_day_complete' | 'weekly_checkin_prompt'

export type BuddyNotificationRow = {
  id: string
  user_id: string
  buddy_pair_id: string | null
  kind: BuddyNotificationKind
  title: string
  body: string | null
  read_at: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

export async function fetchUnreadBuddyNotifications(): Promise<BuddyNotificationRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('buddy_notifications')
    .select('*')
    .eq('user_id', user.id)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []
  return data as BuddyNotificationRow[]
}

export async function markBuddyNotificationRead(id: string): Promise<void> {
  await supabase
    .from('buddy_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
}
