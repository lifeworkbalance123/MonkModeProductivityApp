import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  getActiveUserProgramForAccess,
  programRowAllowsAccess,
} from '@/lib/programAccess'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function createUserScopedClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Returns whether the current user may access their active guided program (trial not expired, paid, etc.).
 * Use from dashboard / Today / training UI instead of duplicating trial logic.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json(
        { canAccess: false, programId: null, reason: 'no_session' },
        { status: 401 },
      )
    }

    const supabase = createUserScopedClient(token)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json(
        { canAccess: false, programId: null, reason: 'no_session' },
        { status: 401 },
      )
    }

    const row = await getActiveUserProgramForAccess(supabase, user.id)
    if (!row) {
      return NextResponse.json({
        canAccess: false,
        programId: null,
        paymentStatus: null,
        trialEnd: null,
        reason: 'no_program',
      })
    }

    const allowed = programRowAllowsAccess(row)
    let reason: string | undefined
    if (!allowed && (row.payment_status ?? '').toLowerCase() === 'trial') {
      reason = 'trial_expired'
    } else if (!allowed) {
      reason = 'access_denied'
    }

    return NextResponse.json({
      canAccess: allowed,
      programId: row.id,
      paymentStatus: row.payment_status ?? null,
      trialEnd: row.trial_end ?? null,
      reason,
    })
  } catch (e) {
    console.error('GET /api/program/access', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
