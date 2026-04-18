import type { SupabaseClient } from '@supabase/supabase-js'
import { sendLifecycleSequenceEmail, type LifecycleEmailType } from '@/lib/email'
import { countMissedProgramDaysInRollingWeek } from '@/lib/financialStake'

type EmailQueueRow = {
  id: string
  user_id: string
  email_type: LifecycleEmailType
  scheduled_for: string
  status: string
}

type EnrollmentRow = {
  user_id: string
  start_date: string
  current_day: number
  completed_days: number[] | null
  status: string
  last_active_date: string | null
}

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** Calendar days from `a` to `b` (UTC day boundaries); e.g. same calendar day => 0. */
function calendarDaysBetweenUtc(later: Date, earlier: Date): number {
  const u = utcDayStart(later).getTime() - utcDayStart(earlier).getTime()
  return Math.floor(u / 86_400_000)
}

function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(key)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!y || !mo || !d) return null
  return new Date(Date.UTC(y, mo - 1, d))
}

async function tryEnqueue(
  admin: SupabaseClient,
  userId: string,
  emailType: LifecycleEmailType,
  scheduledFor: Date,
): Promise<boolean> {
  const { error } = await admin.from('email_queue').insert({
    user_id: userId,
    email_type: emailType,
    scheduled_for: scheduledFor.toISOString(),
    status: 'pending',
  })
  if (error?.code === '23505') return false
  if (error) {
    console.warn('email_queue insert', emailType, error.message)
    return false
  }
  return true
}

/**
 * Send pending rows whose time has come. Service-role client required.
 */
export async function processEmailQueue(
  admin: SupabaseClient,
  options?: { batchSize?: number },
): Promise<{ processed: number; sent: number; failed: number }> {
  const batchSize = options?.batchSize ?? 40
  const nowIso = new Date().toISOString()

  const { data: rows, error } = await admin
    .from('email_queue')
    .select('id,user_id,email_type,scheduled_for,status')
    .eq('status', 'pending')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(batchSize)

  if (error || !rows?.length) {
    if (error) console.error('processEmailQueue select', error.message)
    return { processed: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const row of rows as EmailQueueRow[]) {
    const { data: userRow } = await admin
      .from('users')
      .select('email,first_name')
      .eq('id', row.user_id)
      .maybeSingle()

    const email = (userRow as { email?: string | null } | null)?.email?.trim()
    const firstName = (userRow as { first_name?: string | null } | null)?.first_name ?? null

    if (!email) {
      await admin
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: 'no email on file',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      failed++
      continue
    }

    try {
      await sendLifecycleSequenceEmail(row.email_type, email, firstName)
      await admin
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      sent++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await admin
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: msg.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      failed++
    }
  }

  return { processed: rows.length, sent, failed }
}

/**
 * Insert queue rows for welcome / at-risk / milestone / re-engagement based on enrollments and milestones.
 */
export async function enqueueLifecycleEmails(admin: SupabaseClient): Promise<{
  welcome: number
  atRisk: number
  milestone: number
  reEngage: number
}> {
  const stats = { welcome: 0, atRisk: 0, milestone: 0, reEngage: 0 }
  const now = new Date()
  const todayUtc = utcDayStart(now)

  const { data: enrollments, error: enErr } = await admin
    .from('program_enrollments')
    .select('user_id,start_date,current_day,completed_days,status,last_active_date')
    .eq('status', 'active')

  if (enErr || !enrollments?.length) {
    if (enErr) console.warn('enqueueLifecycleEmails enrollments', enErr.message)
    return stats
  }

  for (const raw of enrollments as EnrollmentRow[]) {
    const start = parseDateKey(raw.start_date)
    if (!start) continue

    const daysSinceStart = calendarDaysBetweenUtc(todayUtc, utcDayStart(start))

    // Welcome: calendar days 0, 2, 6 = program days 1, 3, 7
    if (daysSinceStart === 0) {
      if (await tryEnqueue(admin, raw.user_id, 'welcome_day1', now)) stats.welcome++
    } else if (daysSinceStart === 2) {
      if (await tryEnqueue(admin, raw.user_id, 'welcome_day3', now)) stats.welcome++
    } else if (daysSinceStart === 6) {
      if (await tryEnqueue(admin, raw.user_id, 'welcome_day7', now)) stats.welcome++
    }

    const completed = (raw.completed_days as number[] | null) ?? []
    const missed = countMissedProgramDaysInRollingWeek({
      startDateKey: raw.start_date,
      currentProgramDay: raw.current_day,
      completedDays: completed,
    })

    if (missed >= 4) {
      if (await tryEnqueue(admin, raw.user_id, 'at_risk_4days', now)) stats.atRisk++
    } else if (missed >= 2) {
      if (await tryEnqueue(admin, raw.user_id, 'at_risk_2days', now)) stats.atRisk++
    }

    const lastKey = raw.last_active_date ?? raw.start_date
    const lastDt = parseDateKey(lastKey) ?? start
    const inactiveDays = calendarDaysBetweenUtc(todayUtc, utcDayStart(lastDt))

    if (inactiveDays >= 14) {
      if (await tryEnqueue(admin, raw.user_id, 're_engagement_14days', now)) stats.reEngage++
    } else if (inactiveDays >= 7) {
      if (await tryEnqueue(admin, raw.user_id, 're_engagement_7days', now)) stats.reEngage++
    }
  }

  const { data: milestones, error: msErr } = await admin
    .from('user_milestones')
    .select('user_id,milestone_day')
    .in('milestone_day', [21, 40, 60])

  if (!msErr && milestones?.length) {
    for (const m of milestones as { user_id: string; milestone_day: number }[]) {
      const t =
        m.milestone_day === 21
          ? 'milestone_21'
          : m.milestone_day === 40
            ? 'milestone_40'
            : 'milestone_60'
      if (await tryEnqueue(admin, m.user_id, t as LifecycleEmailType, now)) stats.milestone++
    }
  }

  return stats
}
