import { NextResponse } from 'next/server'
import { insertAdminAudit, requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const VALID_PROGRAM_TYPES = new Set([
  '60day',
  'sprint_standard',
  'sprint_monk',
  'transform',
  'mastery',
])

const PROGRAM_MAX_DAYS: Record<string, number> = {
  '60day': 60,
  sprint_standard: 30,
  sprint_monk: 21,
  transform: 56,
  mastery: 90,
  legacy: 60,
  sprint: 60,
}

type Body = {
  action?:
    | 'start_program'
    | 'reset_progress'
    | 'jump_day'
    | 'complete_day'
    | 'set_upsell_state'
  program_type?: string
  day?: number
  /** true: show upgrade state; false: pro/unlocked */
  force_upsell?: boolean
}

function dayKeyToday() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin, adminUserId } = gate

  const { userId } = await ctx.params
  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action
  if (!action) {
    return NextResponse.json(
      { error: 'action is required' },
      { status: 400 },
    )
  }

  const nowIso = new Date().toISOString()
  const today = dayKeyToday()

  const { data: en, error: enErr } = await admin
    .from('program_enrollments')
    .select('program_type, current_day, completed_days')
    .eq('user_id', userId)
    .maybeSingle()
  if (enErr) return NextResponse.json({ error: enErr.message }, { status: 500 })

  const currentProgram =
    (en as { program_type?: string | null } | null)?.program_type ?? '60day'
  const nextProgram =
    body.program_type && VALID_PROGRAM_TYPES.has(body.program_type)
      ? body.program_type
      : currentProgram

  if (action === 'start_program' || action === 'reset_progress') {
    const { error: upErr } = await admin.from('program_enrollments').upsert(
      {
        user_id: userId,
        program_type: nextProgram,
        start_date: today,
        current_day: 1,
        phase: 'student',
        status: 'active',
        paused_at: null,
        completed_days: [],
        last_active_date: today,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    )
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    if (action === 'start_program') {
      const { error: proErr } = await admin
        .from('users')
        .update({
          is_pro: true,
          plan: 'monthly',
          is_trial_active: false,
          trial_start_date: null,
          trial_end_date: null,
        })
        .eq('id', userId)
      if (proErr) return NextResponse.json({ error: proErr.message }, { status: 500 })
    }

    await insertAdminAudit(admin, {
      admin_user_id: adminUserId,
      target_user_id: userId,
      action,
      details: { program_type: nextProgram },
    })
    return NextResponse.json({ ok: true, action, program_type: nextProgram, current_day: 1 })
  }

  if (action === 'jump_day') {
    const d = Number(body.day)
    if (!Number.isFinite(d)) {
      return NextResponse.json({ error: 'day is required' }, { status: 400 })
    }
    const day = Math.floor(d)
    const max = PROGRAM_MAX_DAYS[nextProgram] ?? 90
    if (day < 1 || day > max) {
      return NextResponse.json({ error: `day must be 1-${max}` }, { status: 400 })
    }

    const completed =
      ((en as { completed_days?: number[] | null } | null)?.completed_days ?? [])
        .filter((x) => x < day)

    const { error: upErr } = await admin
      .from('program_enrollments')
      .update({
        program_type: nextProgram,
        current_day: day,
        completed_days: completed,
        status: 'active',
        updated_at: nowIso,
      })
      .eq('user_id', userId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    await insertAdminAudit(admin, {
      admin_user_id: adminUserId,
      target_user_id: userId,
      action: 'jump_day',
      details: { day, program_type: nextProgram },
    })
    return NextResponse.json({ ok: true, action, current_day: day, program_type: nextProgram })
  }

  if (action === 'complete_day') {
    const day =
      Number.isFinite(Number(body.day)) && Number(body.day) > 0
        ? Math.floor(Number(body.day))
        : Math.max(1, Number((en as { current_day?: number } | null)?.current_day ?? 1))

    const { error: logErr } = await admin.from('daily_actions').upsert(
      {
        user_id: userId,
        day_number: day,
        completed: true,
        completed_at: nowIso,
        notes: 'Admin simulated completion',
      },
      { onConflict: 'user_id,day_number' },
    )
    if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 })

    const completedDays = new Set<number>(
      ((en as { completed_days?: number[] | null } | null)?.completed_days ?? []),
    )
    completedDays.add(day)

    const { error: upErr } = await admin
      .from('program_enrollments')
      .update({
        completed_days: Array.from(completedDays).sort((a, b) => a - b),
        current_day: Math.max(day, Number((en as { current_day?: number } | null)?.current_day ?? 1)),
        updated_at: nowIso,
      })
      .eq('user_id', userId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    await insertAdminAudit(admin, {
      admin_user_id: adminUserId,
      target_user_id: userId,
      action: 'complete_day',
      details: { day },
    })
    return NextResponse.json({ ok: true, action, day })
  }

  if (action === 'set_upsell_state') {
    const forceUpsell = body.force_upsell === true
    const patch = forceUpsell
      ? {
          is_pro: false,
          plan: 'free',
          is_trial_active: false,
          trial_end_date: today,
        }
      : {
          is_pro: true,
          plan: 'monthly',
          is_trial_active: false,
          trial_end_date: null as string | null,
        }

    const { error: upErr } = await admin.from('users').update(patch).eq('id', userId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    await insertAdminAudit(admin, {
      admin_user_id: adminUserId,
      target_user_id: userId,
      action: 'set_upsell_state',
      details: { force_upsell: forceUpsell },
    })
    return NextResponse.json({ ok: true, action, force_upsell: forceUpsell })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
