import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { intakeFromRequestBody, validateIntake } from '@/lib/onboardingIntakeValidation'
import { persistActiveProgramFromIntake } from '@/lib/persistActiveProgramFromIntake'
import { ensureUserRow } from '@/lib/ensureUserRow'

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
