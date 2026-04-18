import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

/** Current user’s open buddy pair (pending as inviter, or active). */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceRoleClient()
  const {
    data: { user },
  } = await admin.auth.getUser(token)

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await admin
    .from('buddy_pairs')
    .select(
      'id,inviter_user_id,invitee_user_id,invite_code,status,both_completed_7_days,discount_applied,inviter_discount_applied,invitee_discount_applied,discount_amount,created_at,activated_at,completed_at',
    )
    .or(`inviter_user_id.eq.${user.id},invitee_user_id.eq.${user.id}`)
    .in('status', ['pending', 'active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pair: data ?? null })
}
