import type { ProgramCheckoutKind } from '@/lib/stripe-checkout'

/** Program track as used in onboarding UI + `user_program_intake.selected_program`. */
export type SelectedProgram = 'sprint_standard' | 'sprint_monk' | 'transform'

export const SELECTED_PROGRAM_LABEL: Record<SelectedProgram, string> = {
  sprint_standard: 'Sprint',
  sprint_monk: 'Monk Mode',
  transform: 'Transform',
}

/** Canonical program tabs / cards: id + marketing label including duration (prices via `PROGRAM_FLOW_PRICES`). */
export const PROGRAM_OPTIONS: readonly { value: SelectedProgram; label: string }[] = [
  { value: 'sprint_standard', label: 'Sprint (30 days)' },
  { value: 'sprint_monk', label: 'Monk Mode (21 days)' },
  { value: 'transform', label: 'Transform (60 days)' },
]

/** Admin onboarding: program tabs for filtering `onboarding_step_templates` by `program_type`. */
export const ADMIN_STEP_PROGRAM_TABS: readonly {
  value: SelectedProgram
  label: string
  icon: string
}[] = [
  { value: 'sprint_standard', label: 'Sprint (30 days)', icon: '⚡' },
  { value: 'sprint_monk', label: 'Monk Mode (21 days)', icon: '🧘' },
  { value: 'transform', label: 'Transform (60 days)', icon: '🎯' },
]

/** Display / validation amounts (cents, USD). Stripe must use matching Price IDs. */
export const PROGRAM_FLOW_PRICES: Record<SelectedProgram, number> = {
  sprint_standard: 2999,
  sprint_monk: 1999,
  transform: 4999,
}

export const PROGRAM_FLOW_CURRENCY = 'USD'

export type ProgramTrackConfig = {
  id: SelectedProgram
  label: string
  duration: string
  benefit: string
  intensity: string
  price_cents: number
  currency: string
  sort_order: number
  is_active: boolean
  checkout_plan: ProgramCheckoutKind
}

/** Fallback used when DB config is unavailable. */
export const DEFAULT_PROGRAM_TRACKS: ProgramTrackConfig[] = [
  {
    id: 'sprint_standard',
    label: 'Sprint',
    duration: '30 days',
    benefit: 'Build focus stamina with a daily execution rhythm.',
    intensity: 'Medium',
    price_cents: 2999,
    currency: 'USD',
    sort_order: 1,
    is_active: true,
    checkout_plan: 'sprint',
  },
  {
    id: 'sprint_monk',
    label: 'Monk Mode',
    duration: '21 days',
    benefit: 'Ship one big project with deep-work blocks every day.',
    intensity: 'High',
    price_cents: 1999,
    currency: 'USD',
    sort_order: 2,
    is_active: true,
    checkout_plan: 'monk_mode',
  },
  {
    id: 'transform',
    label: 'Transform',
    duration: '60 days',
    benefit: 'Rewrite defaults: wake, sleep, anchors, and identity.',
    intensity: 'Steady',
    price_cents: 4999,
    currency: 'USD',
    sort_order: 3,
    is_active: true,
    checkout_plan: 'transform',
  },
]

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
