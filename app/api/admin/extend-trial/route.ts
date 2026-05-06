import { NextResponse } from 'next/server'
import { insertAdminAudit, requireAdmin } from '@/lib/admin-api'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PROGRAM_TYPES = ['sprint_standard', 'sprint_monk', 'transform'] as const
type SelectedProgram = (typeof PROGRAM_TYPES)[number]

function isSelectedProgram(v: string): v is SelectedProgram {
  return (PROGRAM_TYPES as readonly string[]).includes(v)
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Extend guided-program trial for a specific `user_programs` row (matched by user + program_type).
 *
 * Body:
 * - `userId` (required), `programType` (required): `sprint_standard` | `sprint_monk` | `transform`
 * - `extraDays` (optional, default 3) — calendar days; alias `extendDays` supported for older clients
 * - `trialEnd` (optional ISO string) — set absolute end instead of extending by days
 *
 * Auth: existing admin verification (`getAdminUser`). Database updates use service role;
 * actions are logged to `admin_audit_log`.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response
  const { adminUserId } = gate

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  const programTypeRaw =
    typeof body.programType === 'string'
      ? body.programType.trim()
      : typeof body.program_type === 'string'
        ? body.program_type.trim()
        : ''

  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  if (!programTypeRaw || !isSelectedProgram(programTypeRaw)) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid programType (expected sprint_standard, sprint_monk, or transform)',
      },
      { status: 400 },
    )
  }

  const programType = programTypeRaw as SelectedProgram

  const trialEndRaw = body.trialEnd
  const trialEndIso =
    typeof trialEndRaw === 'string' && trialEndRaw.trim().length > 0 ? trialEndRaw.trim() : null

  const extraDaysRaw = body.extraDays ?? body.extendDays
  let extraDays: number
  if (trialEndIso) {
    extraDays = NaN
  } else if (extraDaysRaw === undefined || extraDaysRaw === null) {
    extraDays = 3
  } else if (typeof extraDaysRaw === 'number' && Number.isFinite(extraDaysRaw)) {
    extraDays = Math.floor(extraDaysRaw)
  } else {
    return NextResponse.json(
      { error: 'extraDays must be a finite number when trialEnd is not set' },
      { status: 400 },
    )
  }

  if (!trialEndIso && extraDays < 1) {
    return NextResponse.json({ error: 'extraDays must be at least 1' }, { status: 400 })
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const { data: program, error: fetchError } = await admin
    .from('user_programs')
    .select('trial_end, payment_status')
    .eq('user_id', userId)
    .eq('program_type', programType)
    .maybeSingle()

  if (fetchError) {
    console.error('extend-trial select', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!program) {
    return NextResponse.json(
      { error: 'No user_programs row for this user and program type' },
      { status: 404 },
    )
  }

  let newTrialEnd: Date
  if (trialEndIso) {
    newTrialEnd = new Date(trialEndIso)
    if (Number.isNaN(newTrialEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid trialEnd date' }, { status: 400 })
    }
  } else if (program.trial_end) {
    newTrialEnd = new Date(program.trial_end as string)
    newTrialEnd.setDate(newTrialEnd.getDate() + extraDays)
  } else {
    newTrialEnd = new Date()
    newTrialEnd.setDate(newTrialEnd.getDate() + extraDays)
  }

  const nowIso = new Date().toISOString()

  const { error: updateError } = await admin
    .from('user_programs')
    .update({
      trial_end: newTrialEnd.toISOString(),
      payment_status: 'trial',
      updated_at: nowIso,
    })
    .eq('user_id', userId)
    .eq('program_type', programType)

  if (updateError) {
    console.error('extend-trial update', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await insertAdminAudit(admin, {
    admin_user_id: adminUserId,
    target_user_id: userId,
    action: 'extend_trial',
    details: {
      programType,
      extraDays: trialEndIso ? undefined : extraDays,
      trialEndAbsolute: trialEndIso ?? undefined,
      newTrialEnd: newTrialEnd.toISOString(),
    },
  })

  const newTrialEndIso = newTrialEnd.toISOString()

  return NextResponse.json({
    success: true,
    ok: true,
    newTrialEnd: newTrialEndIso,
    trial_end: newTrialEndIso,
  })
}
