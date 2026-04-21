import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  intakeFromRequestBody,
  pickDistractions,
  pickGoals,
  timeFieldsForUserPrograms,
  validateIntake,
} from '@/lib/onboardingIntakeValidation'

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
    const adminBypass = isAdmin(user) && skipPayment
    if (!adminBypass) {
      const hasPaid = await checkUserPayment(user.id, supabase)
      if (!hasPaid) {
        return json({ error: 'Payment required' }, 402)
      }
    }

    const err = validateIntake(intake)
    if (err) {
      return json({ error: err }, 400)
    }

    const goals = pickGoals(intake)
    const dist = pickDistractions(intake)
    const times = timeFieldsForUserPrograms(intake)

    const programRow = {
      user_id: user.id,
      program_type: intake.selected_program,
      program_day: 1,
      phase: 1,
      status: 'active',
      one_big_task: intake.one_big_task?.trim() || null,
      baseline_wake_time: times.baseline_wake_time,
      baseline_bed_time: times.baseline_bed_time,
      deadline_date: intake.deadline_date?.trim() || null,
      primary_goal: goals.length ? JSON.stringify(goals) : null,
      biggest_distraction: dist.length ? JSON.stringify(dist) : null,
      accountability_preference: intake.accountability_preference ?? null,
      monk_mode_confirmed: intake.monk_mode_confirmed ?? false,
      weekend_wake_time: times.weekend_wake_time,
      weekend_bed_time: times.weekend_bed_time,
    }

    const { error: upErr } = await supabase
      .from('user_programs')
      .upsert(programRow, { onConflict: 'user_id' })

    if (upErr) {
      console.error('program/start user_programs', upErr)
      return json({ error: upErr.message }, 500)
    }

    const logDate = new Date().toISOString().split('T')[0]
    const { error: logErr } = await supabase.from('daily_logs').upsert(
      {
        user_id: user.id,
        log_date: logDate,
        program_type: intake.selected_program,
        program_day: 1,
      },
      { onConflict: 'user_id,log_date' },
    )

    if (logErr) {
      console.error('program/start daily_logs', logErr)
      return json({ error: logErr.message }, 500)
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
