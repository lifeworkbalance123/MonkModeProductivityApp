export type UserPlan = 'free' | 'pro' | 'monthly' | 'lifetime'

export const MONKMODE_PLAN_KEY = 'monkmode_plan'

export const PRO_FEATURES = [
  'unlimited_habits',
  'unlimited_goals',
  'kanban',
  'journal_evening',
  'analytics',
  'full_training',
  'cloud_sync',
  'deep_work',
] as const

export type ProFeature = (typeof PRO_FEATURES)[number]

const PLAN_EVENT = 'monkmode:plan'

function isUserPlan(value: string | null): value is UserPlan {
  return (
    value === 'free' ||
    value === 'pro' ||
    value === 'monthly' ||
    value === 'lifetime'
  )
}

export function getUserPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free'
  try {
    const raw = localStorage.getItem(MONKMODE_PLAN_KEY)
    if (raw && isUserPlan(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'free'
}

export function setUserPlan(plan: UserPlan): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MONKMODE_PLAN_KEY, plan)
    window.dispatchEvent(new Event(PLAN_EVENT))
  } catch {
    /* ignore quota */
  }
}

/** Free-tier caps when `unlimited_*` features are locked */
export const FREE_HABIT_LIMIT = 3
export const FREE_GOAL_LIMIT = 3

/**
 * Returns whether the current plan may use a named feature.
 * Feature keys not listed in PRO_FEATURES are treated as available on all plans.
 */
export function hasAccess(feature: string): boolean {
  const gated = (PRO_FEATURES as readonly string[]).includes(feature)
  if (!gated) return true
  const plan = getUserPlan()
  return plan === 'pro' || plan === 'monthly' || plan === 'lifetime'
}

export const planChangeEventName = PLAN_EVENT
