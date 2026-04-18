import type { ProgramType } from '@/lib/programUtils'

/** Allowed stake amounts (USD cents). */
export const STAKE_AMOUNTS_CENTS = [2500, 5000, 10000] as const

export type StakeAmountCents = (typeof STAKE_AMOUNTS_CENTS)[number]

/** Forfeit if this many program days are missed in a rolling 7-day window (configurable product rule). */
export const STAKE_MAX_MISSED_DAYS_IN_WEEK = 3

export function isAllowedStakeAmountCents(n: number): n is StakeAmountCents {
  return (STAKE_AMOUNTS_CENTS as readonly number[]).includes(n)
}

/**
 * Count program days in the last 7 calendar days from `today` where the user should have
 * logged but `completed_days` does not include that day number.
 * Requires enrollment start_date and current_day from the same program context.
 */
export function countMissedProgramDaysInRollingWeek(params: {
  /** Inclusive start of program (day 1). */
  startDateKey: string
  /** Today’s program day index (1-based). */
  currentProgramDay: number
  /** Days marked complete (from program_enrollments.completed_days). */
  completedDays: number[]
}): number {
  const { startDateKey, currentProgramDay, completedDays } = params
  const completed = new Set(completedDays.filter((d) => Number.isFinite(d) && d >= 1))
  const start = parseStartDate(startDateKey)
  if (!start) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let missed = 0
  for (let i = 0; i < 7; i++) {
    const cal = new Date(today)
    cal.setDate(cal.getDate() - i)
    const dayNum = programDayForCalendarDate(start, cal)
    if (dayNum === null || dayNum < 1 || dayNum > currentProgramDay) continue
    if (!completed.has(dayNum)) missed += 1
  }
  return missed
}

function parseStartDate(key: string): Date | null {
  const [y, m, d] = key.split('-').map((n) => Number(n))
  if (!y || !m || !d) return null
  const dt = new Date(y, m - 1, d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

/** Program day index for a calendar date given program start, or null if before start. */
function programDayForCalendarDate(programStart: Date, cal: Date): number | null {
  const s = new Date(programStart)
  s.setHours(0, 0, 0, 0)
  const c = new Date(cal)
  c.setHours(0, 0, 0, 0)
  const diffMs = c.getTime() - s.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const day = diffDays + 1
  if (day < 1) return null
  return day
}

export type FinancialStakeRow = {
  id: string
  user_id: string
  program_type: ProgramType
  amount: number
  stripe_payment_intent_id: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  created_at: string
  resolved_at: string | null
  failure_reason: string | null
}
