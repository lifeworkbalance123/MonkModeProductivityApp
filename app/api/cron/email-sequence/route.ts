import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import {
  sendDay3Email,
  sendDay7Email,
  sendTrialExpiredEmail,
  sendTrialExpiryEmail,
  sendWinbackEmail,
} from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isoDayBoundsUtc(d: Date): { start: string; end: string } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
  return { start: start.toISOString(), end: end.toISOString() }
}

function addDaysUtc(base: Date, days: number): Date {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

type UserRow = {
  id: string
  email: string | null
  first_name?: string | null
  created_at?: string | null
  trial_end_date?: string | null
  day3_email_sent?: boolean | null
  day7_email_sent?: boolean | null
  trial_expiry_email_sent?: boolean | null
  trial_expired_email_sent?: boolean | null
  cancellation_date?: string | null
  winback_email_sent?: boolean | null
}

async function sendAndMark(
  admin: ReturnType<typeof createServiceRoleClient>,
  id: string,
  patch: Partial<UserRow>,
) {
  await admin.from('users').update(patch).eq('id', id)
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (secret) {
    const auth = request.headers.get('authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const today = new Date()
  const threeDaysAgo = addDaysUtc(today, -3)
  const sevenDaysAgo = addDaysUtc(today, -7)
  const twoDaysFromNow = addDaysUtc(today, 2)
  const yesterday = addDaysUtc(today, -1)

  const day3Bounds = isoDayBoundsUtc(threeDaysAgo)
  const day7Bounds = isoDayBoundsUtc(sevenDaysAgo)
  const expiryBounds = isoDayBoundsUtc(twoDaysFromNow)
  const expiredBounds = isoDayBoundsUtc(yesterday)

  const summary = {
    day3: { attempted: 0, sent: 0, failed: 0 },
    day7: { attempted: 0, sent: 0, failed: 0 },
    expiry: { attempted: 0, sent: 0, failed: 0 },
    expired: { attempted: 0, sent: 0, failed: 0 },
    winback: { attempted: 0, sent: 0, failed: 0 },
  }

  // Day 3
  {
    const { data, error } = await admin
      .from('users')
      .select('id,email,first_name')
      .gte('created_at', day3Bounds.start)
      .lte('created_at', day3Bounds.end)
      .eq('day3_email_sent', false)

    if (!error && data) {
      for (const row of data as UserRow[]) {
        if (!row.email) continue
        summary.day3.attempted++
        try {
          await sendDay3Email(row.email, row.first_name ?? null, 11)
          await sendAndMark(admin, row.id, { day3_email_sent: true })
          summary.day3.sent++
        } catch {
          summary.day3.failed++
        }
      }
    }
  }

  // Day 7
  {
    const { data, error } = await admin
      .from('users')
      .select('id,email,first_name')
      .gte('created_at', day7Bounds.start)
      .lte('created_at', day7Bounds.end)
      .eq('day7_email_sent', false)

    if (!error && data) {
      for (const row of data as UserRow[]) {
        if (!row.email) continue
        summary.day7.attempted++
        try {
          await sendDay7Email(row.email, row.first_name ?? null, 7)
          await sendAndMark(admin, row.id, { day7_email_sent: true })
          summary.day7.sent++
        } catch {
          summary.day7.failed++
        }
      }
    }
  }

  // Day 12 (trial expiry warning): trial_end_date is 2 days from now
  {
    const { data, error } = await admin
      .from('users')
      .select('id,email,first_name')
      .gte('trial_end_date', expiryBounds.start)
      .lte('trial_end_date', expiryBounds.end)
      .eq('trial_expiry_email_sent', false)

    if (!error && data) {
      for (const row of data as UserRow[]) {
        if (!row.email) continue
        summary.expiry.attempted++
        try {
          await sendTrialExpiryEmail(row.email, row.first_name ?? null, {
            monthly: '$9.99/mo',
            annual: '$59.99/yr (save 50%)',
            lifetime: '$149 once',
          })
          await sendAndMark(admin, row.id, { trial_expiry_email_sent: true })
          summary.expiry.sent++
        } catch {
          summary.expiry.failed++
        }
      }
    }
  }

  // Day 15 (trial expired): trial_end_date was yesterday
  {
    const { data, error } = await admin
      .from('users')
      .select('id,email,first_name')
      .gte('trial_end_date', expiredBounds.start)
      .lte('trial_end_date', expiredBounds.end)
      .eq('trial_expired_email_sent', false)

    if (!error && data) {
      for (const row of data as UserRow[]) {
        if (!row.email) continue
        summary.expired.attempted++
        try {
          await sendTrialExpiredEmail(row.email, row.first_name ?? null)
          await sendAndMark(admin, row.id, { trial_expired_email_sent: true })
          summary.expired.sent++
        } catch {
          summary.expired.failed++
        }
      }
    }
  }

  // Cancellation winback after 3 days
  {
    const threeDaysAgo = addDaysUtc(today, -3)
    const bounds = isoDayBoundsUtc(threeDaysAgo)
    const { data, error } = await admin
      .from('users')
      .select('id,email,first_name')
      .gte('cancellation_date', bounds.start)
      .lte('cancellation_date', bounds.end)
      .eq('winback_email_sent', false)

    if (!error && data) {
      for (const row of data as UserRow[]) {
        if (!row.email) continue
        summary.winback.attempted++
        try {
          await sendWinbackEmail(row.email, row.first_name ?? null)
          await sendAndMark(admin, row.id, { winback_email_sent: true })
          summary.winback.sent++
        } catch {
          summary.winback.failed++
        }
      }
    }
  }

  return NextResponse.json({ ok: true, summary })
}

