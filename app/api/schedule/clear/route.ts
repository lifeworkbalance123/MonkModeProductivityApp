import { NextResponse } from 'next/server'
import { resolveUserSupabase } from '@/lib/supabaseRouteUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

/**
 * Clears user-entered schedule data:
 * - `planner_slots` (all rows)
 * - `schedule_templates` (weekly template)
 *
 * Uses a user-scoped Supabase client (Bearer or cookies) so RLS applies.
 */
export async function POST(request: Request) {
  const resolved = await resolveUserSupabase(request)
  if (!resolved.user?.id || !resolved.supabase) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const uid = resolved.user.id
  const supabase = resolved.supabase

  const errors: string[] = []

  const { error: psErr } = await supabase.from('planner_slots').delete().eq('user_id', uid)
  if (psErr) errors.push(psErr.message)

  const { error: stErr } = await supabase.from('schedule_templates').delete().eq('user_id', uid)
  if (stErr) errors.push(stErr.message)

  if (errors.length) {
    return json({ error: errors[0], errors }, 500)
  }

  return json({ ok: true }, 200)
}

