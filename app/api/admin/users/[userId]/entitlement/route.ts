import { addDays } from 'date-fns'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { effectiveMaxProgramDay } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Support: toggle billing + program-bundled Pro window. Caller must be is_admin in public.users.
 * Uses service role for the update (RLS bypass).
 * Partial body: only include fields you want to change (avoids resetting plan on extension-only calls).
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: selfRow, error: selfErr } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (selfErr || !(selfRow as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId: targetId } = await ctx.params
  if (!targetId || !UUID_RE.test(targetId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: existing, error: exErr } = await admin
    .from('users')
    .select(
      'plan, is_pro, trial_end_date, trial_start_date, is_trial_active, program_pro_access_until',
    )
    .eq('id', targetId)
    .maybeSingle()

  if (exErr) {
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 })
  }

  const patch: Record<string, unknown> = {}

  const touchesPlan =
    'plan' in body ||
    'is_pro' in body ||
    'trial_end_date' in body ||
    'trial_start_date' in body ||
    'is_trial_active' in body

  if (touchesPlan) {
    const existingRow = (existing ?? {}) as {
      plan?: string | null
      is_pro?: boolean | null
    }
    const planRaw = (
      typeof body.plan === 'string' ? body.plan : (existingRow.plan ?? 'free')
    )
      .toLowerCase()
      .trim()
    const allowedPlans = [
      'free',
      'trial',
      'monthly',
      'annual',
      'lifetime',
    ] as const
    const plan = allowedPlans.includes(planRaw as (typeof allowedPlans)[number])
      ? planRaw
      : 'free'

    const isPro =
      typeof body.is_pro === 'boolean'
        ? body.is_pro
        : plan === 'monthly' ||
            plan === 'annual' ||
            plan === 'lifetime'

    patch.is_pro = isPro
    patch.plan = plan

    if ('trial_end_date' in body) {
      patch.trial_end_date = body.trial_end_date
    }
    if ('trial_start_date' in body) {
      patch.trial_start_date = body.trial_start_date
    }
    if ('is_trial_active' in body) {
      patch.is_trial_active = body.is_trial_active
    }
  }

  if ('program_pro_access_until' in body) {
    const v = body.program_pro_access_until
    patch.program_pro_access_until =
      v === null || v === '' ? null : typeof v === 'string' ? v : null
  }

  if (typeof body.extend_program_pro_days === 'number' && Number.isFinite(body.extend_program_pro_days)) {
    const add = Math.floor(body.extend_program_pro_days)
    const row = (existing ?? {}) as { program_pro_access_until?: string | null }
    const prevEnd = row.program_pro_access_until
      ? new Date(row.program_pro_access_until)
      : null
    const validPrev = prevEnd && !Number.isNaN(prevEnd.getTime()) ? prevEnd : null
    if (add < 0 && !validPrev) {
      return NextResponse.json(
        {
          error:
            'Cannot subtract bundle Pro days — user has no program_pro_access_until set (join a track first or set a date manually).',
        },
        { status: 400 },
      )
    }
    const now = new Date()
    const base =
      validPrev && validPrev > now ? validPrev : now
    const next = addDays(base, add)
    next.setHours(23, 59, 59, 999)
    patch.program_pro_access_until = next.toISOString()
  }

  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString()
    const { error: upError } = await admin.from('users').update(patch).eq('id', targetId)

    if (upError) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 },
      )
    }
  }

  if (
    typeof body.max_program_day === 'number' ||
    typeof body.extend_max_program_day_by === 'number'
  ) {
    const { data: en, error: enErr } = await admin
      .from('program_enrollments')
      .select('program_type, max_program_day')
      .eq('user_id', targetId)
      .maybeSingle()

    if (enErr) {
      return NextResponse.json({ error: enErr.message }, { status: 500 })
    }
    if (!en) {
      return NextResponse.json(
        { error: 'No program enrollment — max day applies after user joins a track' },
        { status: 400 },
      )
    }

    const enRow = en as { program_type?: string | null; max_program_day?: number | null }
    const programType = enRow.program_type ?? null
    const currentEff = effectiveMaxProgramDay(programType, enRow.max_program_day ?? null)
    /** Cannot shrink below the track's default length (before any admin extension). */
    const baseTrackMax = effectiveMaxProgramDay(programType, null)

    let nextMax: number
    if (typeof body.max_program_day === 'number' && Number.isFinite(body.max_program_day)) {
      nextMax = Math.min(365, Math.max(baseTrackMax, Math.floor(body.max_program_day)))
    } else if (
      typeof body.extend_max_program_day_by === 'number' &&
      Number.isFinite(body.extend_max_program_day_by)
    ) {
      nextMax = Math.min(
        365,
        Math.max(
          baseTrackMax,
          currentEff + Math.floor(body.extend_max_program_day_by),
        ),
      )
    } else {
      nextMax = currentEff
    }

    const { error: enUp } = await admin
      .from('program_enrollments')
      .update({
        max_program_day: nextMax === baseTrackMax ? null : nextMax,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetId)

    if (enUp) {
      return NextResponse.json({ error: enUp.message }, { status: 500 })
    }
  }

  const { data: fresh } = await admin
    .from('users')
    .select('plan, is_pro, program_pro_access_until')
    .eq('id', targetId)
    .maybeSingle()

  const fr = (fresh ?? {}) as {
    plan?: string | null
    is_pro?: boolean | null
    program_pro_access_until?: string | null
  }

  return NextResponse.json({
    ok: true,
    plan: fr.plan ?? 'free',
    is_pro: fr.is_pro ?? false,
    program_pro_access_until: fr.program_pro_access_until ?? null,
  })
}
