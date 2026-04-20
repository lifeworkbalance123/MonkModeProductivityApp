import { NextResponse } from 'next/server'
import { requireAdmin, insertAdminAudit } from '@/lib/admin-api'

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

type Body = {
  /** If set, switches the user to this track; otherwise keeps their current program_type. */
  program_type?: string | null
  /**
   * Omit or `{ enabled: false }` — clears test mode (default after reset).
   * `{ enabled: true, day: n }` — admin test as this user on day n.
   */
  test_mode?: { enabled: boolean; day?: number } | null
}

/**
 * Admin: reset a user's program to Day 1 (start_date = today, clear completed_days, etc.).
 * Optionally change program track and/or enable per-user test mode (same fields as self-service Test Mode).
 */
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

  const ptRaw = body.program_type
  const newProgramType =
    ptRaw != null && ptRaw !== '' && VALID_PROGRAM_TYPES.has(ptRaw) ? ptRaw : null

  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()

  const enrollmentUpdate = {
    start_date: today,
    current_day: 1,
    phase: 'student',
    status: 'active',
    paused_at: null as string | null,
    completed_days: [] as number[],
    last_active_date: today,
    updated_at: now,
    ...(newProgramType ? { program_type: newProgramType } : {}),
  }

  const { data: existing, error: fetchErr } = await admin
    .from('program_enrollments')
    .select('user_id, program_type')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!existing) {
    const insertPt = newProgramType ?? '60day'
    const { error: insErr } = await admin.from('program_enrollments').insert({
      user_id: userId,
      program_type: insertPt,
      start_date: today,
      current_day: 1,
      phase: 'student',
      status: 'active',
      paused_at: null,
      completed_days: [],
      last_active_date: today,
      updated_at: now,
    })
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
  } else {
    const { error: upErr } = await admin
      .from('program_enrollments')
      .update(enrollmentUpdate)
      .eq('user_id', userId)
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
  }

  const tm = body.test_mode
  let testEnabled = false
  let testDayOverride: number | null = null

  if (tm && tm.enabled === true) {
    const d = Number(tm.day)
    if (!Number.isFinite(d) || d < 1 || d > 365) {
      return NextResponse.json(
        { error: 'test_mode.day must be 1–365 when test mode is enabled' },
        { status: 400 },
      )
    }
    testEnabled = true
    testDayOverride = Math.floor(d)
  }

  const { error: userErr } = await admin
    .from('users')
    .update({
      test_mode_enabled: testEnabled,
      test_day_override: testEnabled ? testDayOverride : null,
      updated_at: now,
    })
    .eq('id', userId)

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  await insertAdminAudit(admin, {
    admin_user_id: adminUserId,
    target_user_id: userId,
    action: 'reset_program_day1',
    details: {
      program_type: newProgramType ?? (existing as { program_type?: string })?.program_type ?? null,
      test_mode: testEnabled ? { enabled: true, day: testDayOverride } : { enabled: false },
    },
  })

  return NextResponse.json({
    ok: true,
    start_date: today,
    current_day: 1,
    program_type: newProgramType ?? (existing as { program_type?: string } | null)?.program_type ?? '60day',
    test_mode_enabled: testEnabled,
    test_day_override: testDayOverride,
  })
}
