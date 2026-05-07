import { createServiceRoleClient } from '@/lib/supabase-service'
import { getProgramButtonText, type ProgramType } from '@/lib/programStatus'

export type WitnessPublicPayload = {
  ok: true
  userName: string
  programName: string
  totalDays: number
  currentDay: number
  streakDays: number
  lastActive: string | null
  progress: number
}

function totalDaysForProgramType(t: ProgramType): number {
  return t === 'sprint_standard' ? 30 : t === 'sprint_monk' ? 21 : 60
}

function dateKeyUtc(d: Date): string {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x.toISOString().slice(0, 10)
}

function computeStreakFromDatesUtc(dateKeys: string[]): number {
  const set = new Set(dateKeys)
  let streak = 0
  const day = new Date()
  day.setUTCHours(0, 0, 0, 0)

  const todayKey = dateKeyUtc(day)
  const yesterday = new Date(day)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayKey = dateKeyUtc(yesterday)
  if (!set.has(todayKey) && set.has(yesterdayKey)) {
    day.setUTCDate(day.getUTCDate() - 1)
  }

  while (true) {
    const key = dateKeyUtc(day)
    if (!set.has(key)) break
    streak += 1
    day.setUTCDate(day.getUTCDate() - 1)
  }
  return streak
}

/**
 * Load public witness card data for a slug. Used by `/witness/[slug]` (server component)
 * and `/api/witness/[slug]` so we do not rely on same-origin HTTP fetch during SSR.
 */
export async function getWitnessPublicPayload(slug: string): Promise<WitnessPublicPayload | null> {
  const s = String(slug ?? '').trim()
  if (!s) return null

  const admin = createServiceRoleClient()
  const { data, error } = await admin
    .from('user_programs')
    .select('id,user_id,program_type,program_day,witness_enabled,witness_views')
    .eq('witness_slug', s)
    .maybeSingle<{
      id: string
      user_id: string
      program_type: ProgramType
      program_day: number | null
      witness_enabled: boolean | null
      witness_views: number | null
    }>()

  if (error || !data?.id) return null
  if (!data.witness_enabled) return null

  try {
    await admin
      .from('user_programs')
      .update({ witness_views: (data.witness_views ?? 0) + 1 })
      .eq('id', data.id)
  } catch {
    /* ignore */
  }

  let streakDays = 0
  let lastActive: string | null = null
  try {
    const { data: logs } = await admin
      .from('daily_logs')
      .select('log_date')
      .eq('user_id', data.user_id)
      .eq('program_type', data.program_type)
      .order('log_date', { ascending: false })
      .limit(120)

    const dates =
      (logs as { log_date?: string | null }[] | null)
        ?.map((r) => String(r.log_date ?? '').slice(0, 10))
        .filter(Boolean) ?? []
    lastActive = dates[0] ? `${dates[0]}T00:00:00.000Z` : null
    streakDays = computeStreakFromDatesUtc(dates)
  } catch {
    /* ignore */
  }

  const label = getProgramButtonText(data.program_type)
  const currentDay = data.program_day ?? 1
  const totalDays = totalDaysForProgramType(data.program_type)
  const completed = Math.max(0, currentDay - 1)
  const progressPercent = Math.min(100, Math.round((completed / totalDays) * 100))

  return {
    ok: true as const,
    userName: 'Your buddy',
    programName: label,
    totalDays,
    currentDay,
    streakDays,
    lastActive,
    progress: progressPercent,
  }
}
