import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'
import { PROGRAM_DURATIONS, type ProgramType } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function weekKey(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z')
  const day = d.getUTCDay()
  const diff = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString().slice(0, 10)
}

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { data: enrollments, error: enErr } = await admin
    .from('program_enrollments')
    .select(
      'user_id, program_type, start_date, current_day, completed_days, status, baseline_wake_time',
    )

  if (enErr) {
    return NextResponse.json({ error: enErr.message }, { status: 500 })
  }

  const ens = enrollments ?? []
  const completed = (d: unknown): number[] =>
    Array.isArray(d) ? (d as number[]).filter((x) => Number.isFinite(x) && x >= 1) : []

  let n7 = 0
  let d7 = 0
  let n30 = 0
  let d30 = 0
  let n60 = 0
  let d60 = 0

  const byProgram: Record<string, { total: number; completed: number }> = {}

  for (const e of ens) {
    const pt = (e as { program_type?: string }).program_type ?? '60day'
    const cd = completed((e as { completed_days?: unknown }).completed_days)
    const cur = (e as { current_day?: number }).current_day ?? 1
    const start = (e as { start_date?: string }).start_date
    if (!start) continue

    if (!byProgram[pt]) byProgram[pt] = { total: 0, completed: 0 }
    byProgram[pt].total++

    const maxDur =
      pt in PROGRAM_DURATIONS
        ? PROGRAM_DURATIONS[pt as ProgramType]
        : pt === 'legacy' || pt === 'sprint'
          ? 60
          : 90
    const maxDay = Math.max(...cd, 0)
    if (maxDay >= maxDur || cur >= maxDur) {
      byProgram[pt].completed++
    }

    const has7 = cd.includes(7) || cur > 7
    const has30 = cd.includes(30) || cur > 30
    const has60 = cd.includes(60) || cur > 60

    const daysSince = Math.floor(
      (Date.now() - new Date(start + 'T12:00:00Z').getTime()) / 86_400_000,
    )

    if (daysSince >= 6) {
      n7++
      if (has7) d7++
    }
    if (daysSince >= 29) {
      n30++
      if (has30) d30++
    }
    if (daysSince >= 59) {
      n60++
      if (has60) d60++
    }
  }

  const retention = {
    day1_to_7: n7 ? d7 / n7 : 0,
    day1_to_30: n30 ? d30 / n30 : 0,
    day1_to_60: n60 ? d60 / n60 : 0,
    counts: {
      eligible_day7: n7,
      retained_day7: d7,
      eligible_day30: n30,
      retained_day30: d30,
      eligible_day60: n60,
      retained_day60: d60,
    },
  }

  const completionByProgram = Object.fromEntries(
    Object.entries(byProgram).map(([k, v]) => [
      k,
      v.total ? v.completed / v.total : 0,
    ]),
  )

  const cohortMap = new Map<
    string,
    {
      started: number
      el7: number
      r7: number
      el30: number
      r30: number
      el60: number
      r60: number
    }
  >()

  for (const e of ens) {
    const start = (e as { start_date?: string }).start_date
    if (!start) continue
    const wk = weekKey(start)
    const cd = completed((e as { completed_days?: unknown }).completed_days)
    const cur = (e as { current_day?: number }).current_day ?? 1
    if (!cohortMap.has(wk)) {
      cohortMap.set(wk, {
        started: 0,
        el7: 0,
        r7: 0,
        el30: 0,
        r30: 0,
        el60: 0,
        r60: 0,
      })
    }
    const c = cohortMap.get(wk)!
    c.started++
    const daysSince = Math.floor(
      (Date.now() - new Date(start + 'T12:00:00Z').getTime()) / 86_400_000,
    )
    const has7 = cd.includes(7) || cur > 7
    const has30 = cd.includes(30) || cur > 30
    const has60 = cd.includes(60) || cur > 60
    if (daysSince >= 6) {
      c.el7++
      if (has7) c.r7++
    }
    if (daysSince >= 29) {
      c.el30++
      if (has30) c.r30++
    }
    if (daysSince >= 59) {
      c.el60++
      if (has60) c.r60++
    }
  }

  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 24)
    .map(([week, c]) => ({
      week,
      users_started: c.started,
      eligible_day7: c.el7,
      retained_day7: c.r7,
      eligible_day30: c.el30,
      retained_day30: c.r30,
      eligible_day60: c.el60,
      retained_day60: c.r60,
      rate_day7: c.el7 ? c.r7 / c.el7 : 0,
      rate_day30: c.el30 ? c.r30 / c.el30 : 0,
      rate_day60: c.el60 ? c.r60 / c.el60 : 0,
    }))

  const { data: wakeRows } = await admin
    .from('program_enrollments')
    .select('user_id, baseline_wake_time, program_type')
    .eq('program_type', 'transform')
    .not('baseline_wake_time', 'is', null)
    .limit(200)

  const uids = (wakeRows ?? []).map((w) => (w as { user_id: string }).user_id)
  const baselineByUser = new Map<string, number>()
  for (const w of wakeRows ?? []) {
    const uid = (w as { user_id: string }).user_id
    const base = parseTimeToMinutes((w as { baseline_wake_time?: string }).baseline_wake_time)
    if (base != null) baselineByUser.set(uid, base)
  }

  const { data: wakeActions } =
    uids.length > 0
      ? await admin
          .from('daily_actions')
          .select('user_id, wake_time_logged, day_number')
          .in('user_id', uids)
          .not('wake_time_logged', 'is', null)
      : { data: [] as { user_id: string; wake_time_logged: string; day_number: number }[] }

  const latestWake = new Map<string, { day: number; min: number }>()
  for (const a of wakeActions ?? []) {
    const uid = (a as { user_id: string }).user_id
    const mins = parseTimeToMinutes((a as { wake_time_logged?: string }).wake_time_logged)
    const day = (a as { day_number?: number }).day_number ?? 0
    if (mins == null) continue
    const prev = latestWake.get(uid)
    if (!prev || day > prev.day) {
      latestWake.set(uid, { day, min: mins })
    }
  }

  const wakeGains: number[] = []
  for (const [uid, base] of baselineByUser) {
    const lw = latestWake.get(uid)
    if (!lw) continue
    wakeGains.push(base - lw.min)
  }

  const avgWake =
    wakeGains.length > 0 ? wakeGains.reduce((a, b) => a + b, 0) / wakeGains.length : null

  return NextResponse.json({
    retention,
    completionByProgram,
    cohorts,
    wakeTime: {
      avgGainMinutes: avgWake,
      sampleSize: wakeGains.length,
      histogram: bucketHistogram(wakeGains),
    },
  })
}

function bucketHistogram(values: number[]): { bucket: string; count: number }[] {
  const buckets = [
    { label: '<0', test: (n: number) => n < 0 },
    { label: '0–15', test: (n: number) => n >= 0 && n <= 15 },
    { label: '16–30', test: (n: number) => n > 15 && n <= 30 },
    { label: '31–60', test: (n: number) => n > 30 && n <= 60 },
    { label: '>60', test: (n: number) => n > 60 },
  ]
  return buckets.map((b) => ({
    bucket: b.label,
    count: values.filter((n) => b.test(n)).length,
  }))
}
