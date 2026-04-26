import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isSelectedProgram } from '@/lib/onboardingProgramFlow'

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
      return NextResponse.json(
        { error: status === 401 ? 'Unauthorized: Not logged in' : 'Unauthorized: Admin access required' },
        { status },
      )
    }

    const body = (await req.json()) as {
      userId?: string
      programType?: string
      newDay?: number
      programDay?: number
    }

    const targetUserId = (body.userId ?? user.id).trim()
    const programTypeRaw = (body.programType ?? '').trim()
    const requestedDay = body.newDay ?? body.programDay

    const day = Number(requestedDay)
    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 })
    }
    if (!Number.isFinite(day)) {
      return NextResponse.json({ error: 'Missing required field: newDay' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    let activeProgramType: string | null = null
    if (programTypeRaw) {
      if (!isSelectedProgram(programTypeRaw)) {
        return NextResponse.json({ error: 'Invalid programType' }, { status: 400 })
      }
      activeProgramType = programTypeRaw
    }

    const maxDays: Record<string, number> = {
      sprint_standard: 30,
      sprint_monk: 21,
      transform: 60,
    }
    const maxDay = activeProgramType ? maxDays[activeProgramType] ?? 60 : 60
    if (day < 1 || day > maxDay) {
      return NextResponse.json(
        { error: `Day must be between 1 and ${maxDay}` },
        { status: 400 },
      )
    }
    const programDay = Math.floor(day)

    const { data: updated, error: upErr } = await supabase
      .from('user_programs')
      .update({ program_day: programDay, updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .select('program_type')
      .maybeSingle()
    if (upErr) {
      console.error('Admin test/jump-to-day: update user_programs failed:', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
    if (!activeProgramType) {
      activeProgramType = (updated as { program_type?: string } | null)?.program_type ?? null
    }

    if (!activeProgramType) {
      // No active row found: revive any existing row for this user, otherwise create a default sprint row.
      const { data: existingAny, error: existingErr } = await supabase
        .from('user_programs')
        .select('program_type')
        .eq('user_id', targetUserId)
        .limit(1)
        .maybeSingle<{ program_type: string }>()
      if (existingErr) {
        console.error('Admin test/jump-to-day: lookup existing program failed:', existingErr)
        return NextResponse.json({ error: existingErr.message }, { status: 500 })
      }

      const fallbackProgramType = existingAny?.program_type ?? 'sprint_standard'
      const { error: reviveErr } = await supabase.from('user_programs').upsert(
        {
          user_id: targetUserId,
          program_type: fallbackProgramType,
          program_day: programDay,
          phase: 1,
          status: 'active',
          baseline_wake_time: '07:30:00',
          baseline_bed_time: '23:00:00',
        },
        { onConflict: 'user_id' },
      )
      if (reviveErr) {
        console.error('Admin test/jump-to-day: create/revive program row failed:', reviveErr)
        return NextResponse.json({ error: reviveErr.message }, { status: 500 })
      }
      activeProgramType = fallbackProgramType
    }

    const today = new Date().toISOString().split('T')[0]
    const { error: logErr } = await supabase.from('daily_logs').upsert(
      {
        user_id: targetUserId,
        log_date: today,
        program_type: activeProgramType,
        program_day: programDay,
      },
      { onConflict: 'user_id,log_date' },
    )
    if (logErr) {
      console.error('Admin test/jump-to-day: upsert daily_logs failed:', logErr)
      return NextResponse.json({ error: logErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, programDay, programType: activeProgramType, userId: targetUserId })
  } catch (e) {
    console.error('Admin test/jump-to-day: unexpected error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
