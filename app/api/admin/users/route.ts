import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'
import { countMissedProgramDaysInRollingWeek } from '@/lib/financialStake'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type EnrollmentRow = {
  user_id: string
  program_type: string | null
  current_day: number | null
  phase: string | null
  status: string | null
  paused_at: string | null
  start_date: string | null
  last_active_date: string | null
  completed_days: number[] | null
}

function parseIntParam(v: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { searchParams } = new URL(request.url)
  const page = parseIntParam(searchParams.get('page'), 1, 1, 10_000)
  const pageSize = parseIntParam(searchParams.get('pageSize'), 25, 1, 100)
  const search = (searchParams.get('search') ?? '').trim()
  const programType = (searchParams.get('programType') ?? '').trim()
  const statusFilter = (searchParams.get('status') ?? '').trim()
  const atRiskOnly = searchParams.get('atRisk') === '1' || searchParams.get('atRisk') === 'true'

  const { data: allEnrollments, error: enErr } = await admin
    .from('program_enrollments')
    .select(
      'user_id, program_type, current_day, phase, status, paused_at, start_date, last_active_date, completed_days',
    )

  if (enErr) {
    return NextResponse.json({ error: enErr.message }, { status: 500 })
  }

  const enrollments = (allEnrollments ?? []) as EnrollmentRow[]
  const enByUser = new Map<string, EnrollmentRow>()
  for (const e of enrollments) {
    enByUser.set(e.user_id, e)
  }

  let allowedIds: string[] | null = null

  if (programType && programType !== 'all') {
    allowedIds = [
      ...new Set(
        enrollments.filter((e) => e.program_type === programType).map((e) => e.user_id),
      ),
    ]
  }
  if (statusFilter && statusFilter !== 'all') {
    const byStatus = enrollments.filter((e) => (e.status ?? 'active') === statusFilter).map((e) => e.user_id)
    allowedIds = allowedIds === null ? byStatus : allowedIds.filter((id) => byStatus.includes(id))
  }

  if (atRiskOnly) {
    const atRiskIds = new Set<string>()
    for (const e of enrollments) {
      if (!e.start_date) continue
      const missed = countMissedProgramDaysInRollingWeek({
        startDateKey: e.start_date,
        currentProgramDay: e.current_day ?? 1,
        completedDays: (e.completed_days as number[] | null) ?? [],
      })
      if (missed >= 2) atRiskIds.add(e.user_id)
    }
    const arr = [...atRiskIds]
    allowedIds =
      allowedIds === null ? arr : allowedIds.filter((id) => atRiskIds.has(id))
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let userQuery = admin
    .from('users')
    .select('id, email, first_name, plan, is_pro, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (allowedIds !== null) {
    if (allowedIds.length === 0) {
      return NextResponse.json({
        page,
        pageSize,
        total: 0,
        users: [],
      })
    }
    userQuery = userQuery.in('id', allowedIds)
  }

  if (search) {
    userQuery = userQuery.or(`email.ilike.%${search}%,first_name.ilike.%${search}%`)
  }

  const { data: userRows, error: userErr, count: total } = await userQuery.range(from, to)

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  const users = userRows ?? []
  const ids = users.map((u) => u.id)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString()

  const { data: recentActions } = ids.length
    ? await admin
        .from('daily_actions')
        .select('user_id, completed_at')
        .in('user_id', ids)
        .gte('completed_at', weekAgoIso)
    : { data: [] as { user_id: string; completed_at: string | null }[] }

  const recentCount = new Map<string, number>()
  for (const a of recentActions ?? []) {
    if (!a.completed_at) continue
    recentCount.set(a.user_id, (recentCount.get(a.user_id) ?? 0) + 1)
  }

  const rows = users.map((u) => {
    const en = enByUser.get(u.id)
    const missed = en?.start_date
      ? countMissedProgramDaysInRollingWeek({
          startDateKey: en.start_date,
          currentProgramDay: en.current_day ?? 1,
          completedDays: (en.completed_days as number[] | null) ?? [],
        })
      : 0

    const atRisk = missed >= 2
    const lastLog = en?.last_active_date ?? null

    return {
      id: u.id,
      email: u.email,
      name: (u as { first_name?: string | null }).first_name ?? null,
      plan: u.plan,
      is_pro: u.is_pro,
      created_at: u.created_at,
      program_type: en?.program_type ?? null,
      program_day: en?.current_day ?? null,
      phase: en?.phase ?? null,
      status: en?.status ?? null,
      paused_at: en?.paused_at ?? null,
      started_at: en?.start_date ?? null,
      last_log_date: lastLog,
      missed_days_count: missed,
      rescue_mode: atRisk,
      at_risk: atRisk,
      logs_last_7_days: recentCount.get(u.id) ?? 0,
    }
  })

  return NextResponse.json({
    page,
    pageSize,
    total: total ?? rows.length,
    users: rows,
  })
}
