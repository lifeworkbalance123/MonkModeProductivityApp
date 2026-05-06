import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { intakeFromRequestBody, validateIntake } from '@/lib/onboardingIntakeValidation'
import { persistActiveProgramFromIntake } from '@/lib/persistActiveProgramFromIntake'
import { ensureUserRow } from '@/lib/ensureUserRow'
import { isProgramFreeTrialEnabled } from '@/lib/programFreeTrialFlag'
import { DEFAULT_PROGRAM_TRIAL_DAYS, isProgramTrialAccessValid } from '@/lib/programTrial'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status })
}

async function checkUserPayment(userId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('users')
    .select('is_pro, plan, is_trial_active')
    .eq('id', userId)
    .maybeSingle()

  if (error) return false

  const row = (data as { is_pro?: boolean; plan?: string | null; is_trial_active?: boolean } | null) ?? null
  if (!row) return false
  if (row.is_pro === true) return true
  if (row.is_trial_active === true) return true

  const plan = (row.plan ?? '').toLowerCase()
  return plan === 'monthly' || plan === 'annual' || plan === 'lifetime' || plan === 'trial'
}

function supabaseWithUserJwt(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env')
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Persists `user_programs` + today’s `daily_logs` stub (same rules as onboarding intake). */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? ''
    if (!token) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabase = supabaseWithUserJwt(token)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user?.id) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const ensuredUser = await ensureUserRow(supabase, user)
    if (!ensuredUser.ok) {
      return json({ error: ensuredUser.error }, 500)
    }

    let raw: Record<string, unknown>
    try {
      raw = (await req.json()) as Record<string, unknown>
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }

    const intake = intakeFromRequestBody(raw)
    if (!intake) {
      return json({ error: 'Invalid programType / selected_program' }, 400)
    }

    const skipPayment = raw.skipPayment === true
    const startProgramTrial = raw.startProgramTrial === true

    const err = validateIntake(intake)
    if (err) {
      return json({ error: err }, 400)
    }

    const { data: existingUp } = await supabase
      .from('user_programs')
      .select('payment_status, trial_end')
      .eq('user_id', user.id)
      .maybeSingle()

    const existing = existingUp as {
      payment_status?: string | null
      trial_end?: string | null
    } | null

    if (startProgramTrial) {
      if (skipPayment) {
        return json({ error: 'Invalid trial request' }, 400)
      }
      if (!isProgramFreeTrialEnabled()) {
        return json(
          {
            error:
              'Program trial is disabled. Set ENABLE_FREE_TRIAL or NEXT_PUBLIC_ENABLE_FREE_TRIAL.',
          },
          403,
        )
      }
      if (existing && (existing.payment_status === 'paid' || isProgramTrialAccessValid(existing))) {
        return json({ error: 'You already have an active program.' }, 400)
      }
      if (
        existing?.payment_status === 'trial' &&
        existing.trial_end &&
        new Date(existing.trial_end) <= new Date()
      ) {
        return json(
          { error: 'Your trial ended. Purchase a program on the Join page to continue.' },
          400,
        )
      }
      if (existing) {
        return json({ error: 'Program already started.' }, 400)
      }

      const persisted = await persistActiveProgramFromIntake(supabase, user.id, intake, {
        programTrialDays: DEFAULT_PROGRAM_TRIAL_DAYS,
      })
      if (!persisted.ok) {
        return json({ error: persisted.error }, 500)
      }

      return json({ success: true, trial: true }, 200)
    }

    const adminBypass = isAdmin(user) && skipPayment
    if (adminBypass) {
      const persisted = await persistActiveProgramFromIntake(supabase, user.id, intake)
      if (!persisted.ok) {
        return json({ error: persisted.error }, 500)
      }
      return json({ success: true }, 200)
    }

    if (existing && (existing.payment_status === 'paid' || isProgramTrialAccessValid(existing))) {
      return json({ error: 'You already have an active program.' }, 400)
    }

    if (
      existing?.payment_status === 'trial' &&
      existing.trial_end &&
      new Date(existing.trial_end) <= new Date()
    ) {
      const hasPaid = await checkUserPayment(user.id, supabase)
      if (!hasPaid) {
        return json(
          { error: 'Trial expired. Purchase a program to continue.', code: 'trial_expired' },
          402,
        )
      }
    }

    if (!(await checkUserPayment(user.id, supabase))) {
      return json({ error: 'Payment required' }, 402)
    }

    const persisted = await persistActiveProgramFromIntake(supabase, user.id, intake)
    if (!persisted.ok) {
      return json({ error: persisted.error }, 500)
    }

    return json({ success: true }, 200)
  } catch (e) {
    console.error('POST /api/program/start', e)
    return json(
      { error: e instanceof Error ? e.message : 'Server error' },
      500,
    )
  }
}
