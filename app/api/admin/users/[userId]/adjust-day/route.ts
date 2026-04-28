import { NextResponse } from 'next/server'
import { requireAdmin, insertAdminAudit } from '@/lib/admin-api'
import { effectiveMaxProgramDay } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  let body: { day?: number; reason?: string }
  try {
    body = (await request.json()) as { day?: number; reason?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const day = Number(body.day)
  if (!Number.isFinite(day) || day < 1 || day > 365) {
    return NextResponse.json({ error: 'day must be 1–365' }, { status: 400 })
  }

  const { data: en, error: enErr } = await admin
    .from('program_enrollments')
    .select('user_id, program_type, completed_days, max_program_day')
    .eq('user_id', userId)
    .maybeSingle()

  if (enErr || !en) {
    return NextResponse.json({ error: 'No program enrollment for user' }, { status: 404 })
  }

  const enRow = en as {
    program_type?: string | null
    max_program_day?: number | null
  }
  const maxD = effectiveMaxProgramDay(enRow.program_type ?? null, enRow.max_program_day ?? null)
  if (day > maxD) {
    return NextResponse.json(
      { error: `day exceeds max for program (${maxD})` },
      { status: 400 },
    )
  }

  const completed = ((en as { completed_days?: number[] | null }).completed_days ?? []).filter(
    (d) => d < day,
  )

  const { error: upErr } = await admin
    .from('program_enrollments')
    .update({
      current_day: day,
      completed_days: completed,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  await insertAdminAudit(admin, {
    admin_user_id: adminUserId,
    target_user_id: userId,
    action: 'adjust_program_day',
    details: { new_day: day, reason: body.reason ?? null },
  })

  return NextResponse.json({ ok: true, current_day: day })
}
