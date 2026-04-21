import type { ProgramCheckoutKind } from '@/lib/stripe-checkout'

/** Program track as used in onboarding UI + `user_program_intake.selected_program`. */
export type SelectedProgram = 'sprint_standard' | 'sprint_monk' | 'transform'

export const SELECTED_PROGRAM_LABEL: Record<SelectedProgram, string> = {
  sprint_standard: 'Sprint',
  sprint_monk: 'Monk Mode',
  transform: 'Transform',
}

/** Display / validation amounts (cents, USD). Stripe must use matching Price IDs. */
export const PROGRAM_FLOW_PRICES: Record<SelectedProgram, number> = {
  sprint_standard: 2999,
  sprint_monk: 1999,
  transform: 4999,
}

export const PROGRAM_FLOW_CURRENCY = 'USD'

export function isSelectedProgram(v: string | null | undefined): v is SelectedProgram {
  return v === 'sprint_standard' || v === 'sprint_monk' || v === 'transform'
}

/** Map legacy `?program=sprint|monk_mode|transform` query values to intake ids. */
export function urlParamToSelectedProgram(v: string | null | undefined): SelectedProgram | null {
  if (!v) return null
  const n = v.toLowerCase().trim()
  if (n === 'sprint' || n === 'sprint_standard') return 'sprint_standard'
  if (n === 'monk_mode' || n === 'sprint_monk') return 'sprint_monk'
  if (n === 'transform') return 'transform'
  return null
}

export function selectedProgramToCheckoutPlan(p: SelectedProgram): ProgramCheckoutKind {
  if (p === 'sprint_standard') return 'sprint'
  if (p === 'sprint_monk') return 'monk_mode'
  return 'transform'
}

export type AccountabilityPreference = 'solo' | 'buddy' | 'coach'

export type TransformPrimaryGoal = 'habits' | 'stress' | 'time' | 'project'

export type BiggestDistraction =
  | 'social_media'
  | 'email'
  | 'tv'
  | 'gaming'
  | 'news'
  | 'other'

/** Payload accepted by POST /api/onboarding/complete */
export type ProgramIntakePayload = {
  selected_program: SelectedProgram
  one_big_task?: string | null
  baseline_wake_time?: string | null
  accountability_preference?: AccountabilityPreference | null
  monk_mode_confirmed?: boolean | null
  deadline_date?: string | null
  primary_goal?: TransformPrimaryGoal[] | null
  baseline_bed_time?: string | null
  weekend_same_as_weekday?: boolean | null
  weekend_wake_time?: string | null
  weekend_bed_time?: string | null
  sleep_hours_goal?: number | null
  biggest_distraction?: BiggestDistraction[] | null
}
