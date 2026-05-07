import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import type { ProgramIntakePayload, SelectedProgram } from '@/lib/onboardingProgramFlow'
import { pickDistractions, pickGoals, validateIntake } from '@/lib/onboardingIntakeValidation'
import { persistActiveProgramFromIntake } from '@/lib/persistActiveProgramFromIntake'
import { ensureUserRow } from '@/lib/ensureUserRow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status })
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
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

    let body: ProgramIntakePayload
    let skipPayment = false
    try {
      const raw = (await request.json()) as ProgramIntakePayload & {
        skipPayment?: boolean
      }
      body = raw
      skipPayment = raw.skipPayment === true
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }

    const err = validateIntake(body)
    if (err) {
      return json({ error: err }, 400)
    }

    const goals = pickGoals(body)
    const dist = pickDistractions(body)

    const row = {
      user_id: user.id,
      selected_program: body.selected_program as SelectedProgram,
      one_big_task: body.one_big_task?.trim() || null,
      baseline_wake_time: body.baseline_wake_time?.trim() || null,
      accountability_preference: body.accountability_preference ?? null,
      monk_mode_confirmed: body.monk_mode_confirmed ?? null,
      deadline_date: body.deadline_date?.trim() || null,
      primary_goal: goals.length ? JSON.stringify(goals) : null,
      baseline_bed_time: body.baseline_bed_time?.trim() || null,
      weekend_same_as_weekday: body.weekend_same_as_weekday ?? null,
      weekend_wake_time: body.weekend_wake_time?.trim() || null,
      weekend_bed_time: body.weekend_bed_time?.trim() || null,
      sleep_hours_goal: body.sleep_hours_goal ?? null,
      biggest_distraction: dist.length ? JSON.stringify(dist) : null,
    }

    const { error } = await supabase.from('user_program_intake').upsert(row, { onConflict: 'user_id' })

    if (error) {
      console.error('onboarding/complete upsert', error)
      return json({ error: error.message }, 500)
    }

    const adminSkip = skipPayment && isAdmin(user)
    let activeProgramPersisted = false
    if (adminSkip) {
      const persisted = await persistActiveProgramFromIntake(supabase, user.id, body)
      if (!persisted.ok) {
        return json({ error: persisted.error }, 500)
      }
      activeProgramPersisted = true
    }

    return json(
      {
        ok: true,
        skipPaymentAccepted: adminSkip,
        activeProgramPersisted,
      },
      200,
    )
  } catch (e) {
    console.error('POST /api/onboarding/complete', e)
    return json(
      { error: e instanceof Error ? e.message : 'Server error' },
      500,
    )
  }
}
