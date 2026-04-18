import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-service'
import {
  STAKE_MAX_MISSED_DAYS_IN_WEEK,
  countMissedProgramDaysInRollingWeek,
} from '@/lib/financialStake'
import { getMaxDays, type ProgramType } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Weekly (or scheduled) job: for each pending stake, compare rolling 7-day missed logs
 * to the threshold — capture (forfeit) or release (cancel authorization).
 * Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const { data: stakes, error: listErr } = await admin
    .from('financial_stakes')
    .select('id,user_id,stripe_payment_intent_id,amount,program_type')
    .eq('status', 'pending')

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }

  const rows = stakes ?? []
  const results: { stakeId: string; action: string; missed?: number; error?: string }[] = []

  for (const s of rows) {
    const row = s as {
      id: string
      user_id: string
      stripe_payment_intent_id: string
      amount: number
      program_type: ProgramType
    }

    const { data: en } = await admin
      .from('program_enrollments')
      .select('start_date,completed_days,current_day')
      .eq('user_id', row.user_id)
      .maybeSingle()

    if (!en) {
      results.push({ stakeId: row.id, action: 'skip', error: 'no_enrollment' })
      continue
    }

    const startDate = (en as { start_date: string }).start_date
    const completedDays = ((en as { completed_days?: number[] }).completed_days ?? []) as number[]
    const currentDay = Number((en as { current_day?: number }).current_day ?? 1)

    const missed = countMissedProgramDaysInRollingWeek({
      startDateKey: startDate,
      currentProgramDay: currentDay,
      completedDays,
    })

    const maxDays = getMaxDays(row.program_type)
    const programFinished = currentDay >= maxDays
    const shouldForfeit = missed >= STAKE_MAX_MISSED_DAYS_IN_WEEK
    const now = new Date().toISOString()

    try {
      if (shouldForfeit) {
        await stripe.paymentIntents.capture(row.stripe_payment_intent_id)
        await admin
          .from('financial_stakes')
          .update({
            status: 'failed',
            resolved_at: now,
            failure_reason: `${missed} missed day(s) in the last 7 calendar days (threshold ${STAKE_MAX_MISSED_DAYS_IN_WEEK})`,
          })
          .eq('id', row.id)
        results.push({ stakeId: row.id, action: 'captured', missed })
      } else if (programFinished) {
        await stripe.paymentIntents.cancel(row.stripe_payment_intent_id)
        await admin
          .from('financial_stakes')
          .update({
            status: 'success',
            resolved_at: now,
            failure_reason: null,
          })
          .eq('id', row.id)
        results.push({ stakeId: row.id, action: 'released', missed })
      } else {
        results.push({ stakeId: row.id, action: 'pending', missed })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ stakeId: row.id, action: 'error', missed, error: msg })
    }
  }

  return NextResponse.json({ ok: true, processed: rows.length, results })
}
