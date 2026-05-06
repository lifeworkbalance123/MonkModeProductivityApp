/** Default free program trial length for new onboarding enrollments. */
export const DEFAULT_PROGRAM_TRIAL_DAYS = 3

export type ProgramPaymentStatus = 'pending' | 'trial' | 'paid' | 'expired'

/**
 * Trial end using local calendar days from “now” (same idea as
 * `trialEnd.setDate(trialEnd.getDate() + days)`), stored as ISO UTC.
 */
export function computeProgramTrialEndCalendarDaysFromNow(days: number): string {
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + days)
  return trialEnd.toISOString()
}

export function isProgramTrialAccessValid(params: {
  payment_status?: string | null
  trial_end?: string | null
  now?: Date
}): boolean {
  const now = params.now ?? new Date()
  const status = (params.payment_status ?? '').toLowerCase()
  if (status === 'paid') return true
  if (status === 'pending' && !params.trial_end) return true
  if (status !== 'trial' || !params.trial_end) return false
  return new Date(params.trial_end) > now
}
