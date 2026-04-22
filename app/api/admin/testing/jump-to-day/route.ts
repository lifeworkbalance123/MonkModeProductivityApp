import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { user, error, status } = await getAdminUser(req)
    if (error || !user?.id) {
      if (status === 401) {
        console.error('Admin test/jump-to-day: no authenticated user in request')
      } else if (status === 403) {
        console.error(
          `Admin test/jump-to-day: user ${user?.email ?? 'unknown'} is not admin`,
        )
      }
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status })
    }

    const body = (await req.json()) as { programDay?: number }
    const day = Number(body.programDay)
    if (!Number.isFinite(day) || day < 1 || day > 60) {
      return NextResponse.json({ error: 'Invalid day (1-60)' }, { status: 400 })
    }
    const programDay = Math.floor(day)

    const supabase = createServiceRoleClient()

    const { data: updated, error: upErr } = await supabase
      .from('user_programs')
      .update({ program_day: programDay })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .select('program_type')
      .maybeSingle()
    if (upErr) {
      console.error('Admin test/jump-to-day: update user_programs failed:', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
    if (!updated?.program_type) {
      return NextResponse.json(
        { error: 'No active user_programs row found for user' },
        { status: 404 },
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const { error: logErr } = await supabase.from('daily_logs').upsert(
      {
        user_id: user.id,
        log_date: today,
        program_type: updated.program_type,
        program_day: programDay,
      },
      { onConflict: 'user_id,log_date' },
    )
    if (logErr) {
      console.error('Admin test/jump-to-day: upsert daily_logs failed:', logErr)
      return NextResponse.json({ error: logErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, programDay })
  } catch (e) {
    console.error('Admin test/jump-to-day: unexpected error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
