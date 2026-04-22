import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { isSelectedProgram } from '@/lib/onboardingProgramFlow'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { user, error, status } = await getAdminUser(req)
    if (error || !user?.id) {
      if (status === 401) {
        console.error('Admin test/start-program: no authenticated user in request')
      } else if (status === 403) {
        console.error(
          `Admin test/start-program: user ${user?.email ?? 'unknown'} is not admin`,
        )
      }
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status })
    }

    const body = (await req.json()) as { programType?: string }
    const programType = (body.programType ?? '').trim()
    if (!isSelectedProgram(programType)) {
      return NextResponse.json({ error: 'Invalid programType' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const durationDays =
      programType === 'sprint_standard' ? 30 : programType === 'sprint_monk' ? 21 : 60

    const { error: delErr } = await supabase
      .from('user_programs')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'active')
    if (delErr) {
      console.error('Admin test/start-program: delete active program failed:', delErr)
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    const { error: upErr } = await supabase.from('user_programs').insert({
      user_id: user.id,
      program_type: programType,
      program_day: 1,
      phase: 1,
      status: 'active',
      duration_days: durationDays,
      baseline_wake_time: '07:30:00',
      baseline_bed_time: '23:00:00',
      started_at: new Date().toISOString(),
    })
    if (upErr) {
      console.error('Admin test/start-program: insert user_programs failed:', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const logDate = new Date().toISOString().split('T')[0]
    const { error: logErr } = await supabase.from('daily_logs').upsert(
      {
        user_id: user.id,
        log_date: logDate,
        program_type: programType,
        program_day: 1,
        lemon_water_done: false,
        micro_journal_completed: false,
        evening_checkin_completed: false,
      },
      { onConflict: 'user_id,log_date' },
    )
    if (logErr) {
      console.error('Admin test/start-program: upsert daily_logs failed:', logErr)
      return NextResponse.json({ error: logErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, programType })
  } catch (e) {
    console.error('Admin test/start-program: unexpected error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
