import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { user, error, status } = await getAdminUser(req)
    if (error || !user?.id) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status })
    }

    const supabase = createServiceRoleClient()

    const { data: existing, error: existingErr } = await supabase
      .from('user_programs')
      .select('program_type')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 })
    }
    if (!existing?.program_type) {
      return NextResponse.json(
        { error: 'No existing user_programs row found' },
        { status: 404 },
      )
    }

    const { error: upErr } = await supabase
      .from('user_programs')
      .update({
        program_day: 1,
        phase: 1,
        status: 'active',
        baseline_wake_time: '07:30:00',
        baseline_bed_time: '23:00:00',
      })
      .eq('user_id', user.id)
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const logDate = new Date().toISOString().split('T')[0]
    const { error: logErr } = await supabase.from('daily_logs').upsert(
      {
        user_id: user.id,
        log_date: logDate,
        program_type: existing.program_type,
        program_day: 1,
      },
      { onConflict: 'user_id,log_date' },
    )
    if (logErr) {
      return NextResponse.json({ error: logErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, programType: existing.program_type })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
