import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

type Body = { inviteCode?: string }

/**
 * Accept a buddy invite (invitee). Idempotent if already paired with this code.
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = (body.inviteCode ?? '').trim().toUpperCase()
  if (!raw || !raw.startsWith('BD')) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }

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

  const { data: pair, error: findErr } = await admin
    .from('buddy_pairs')
    .select('id,inviter_user_id,invitee_user_id,status')
    .eq('invite_code', raw)
    .maybeSingle()

  if (findErr || !pair) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  const p = pair as {
    id: string
    inviter_user_id: string
    invitee_user_id: string | null
    status: string
  }

  if (p.inviter_user_id === user.id) {
    return NextResponse.json({ error: 'You cannot accept your own invite' }, { status: 400 })
  }

  if (p.status === 'active' && p.invitee_user_id === user.id) {
    return NextResponse.json({ ok: true, alreadyAccepted: true, pairId: p.id })
  }

  if (p.status !== 'pending' || p.invitee_user_id != null) {
    return NextResponse.json({ error: 'This invite is no longer available' }, { status: 409 })
  }

  const { data: otherPair } = await admin
    .from('buddy_pairs')
    .select('id')
    .eq('invitee_user_id', user.id)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (otherPair) {
    return NextResponse.json(
      { error: 'You already have an open buddy invite or active pair' },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()
  const { error: updErr } = await admin
    .from('buddy_pairs')
    .update({
      invitee_user_id: user.id,
      status: 'active',
      activated_at: now,
    })
    .eq('id', p.id)
    .eq('status', 'pending')
    .is('invitee_user_id', null)

  if (updErr) {
    console.error('buddy accept update', updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pairId: p.id })
}
