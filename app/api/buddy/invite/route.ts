import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

/**
 * Create a pending buddy invite for the authenticated user (inviter).
 * Returns `{ inviteCode, pairId }` for sharing (e.g. /buddy/BD…).
 */
export async function POST(request: Request) {
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

  const { data: existing } = await admin
    .from('buddy_pairs')
    .select('id')
    .eq('inviter_user_id', user.id)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You already have an open buddy invite or active pair.' },
      { status: 409 },
    )
  }

  const { data: code, error: codeErr } = await admin.rpc('generate_buddy_invite_code')
  if (codeErr || typeof code !== 'string' || !code) {
    console.error('generate_buddy_invite_code', codeErr)
    return NextResponse.json({ error: 'Could not generate invite code' }, { status: 500 })
  }

  const { data: row, error: insErr } = await admin
    .from('buddy_pairs')
    .insert({
      inviter_user_id: user.id,
      invite_code: code,
      status: 'pending',
    })
    .select('id,invite_code,status,created_at')
    .single()

  if (insErr || !row) {
    console.error('buddy_pairs insert', insErr)
    return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    inviteCode: (row as { invite_code: string }).invite_code,
    pairId: (row as { id: string }).id,
  })
}
