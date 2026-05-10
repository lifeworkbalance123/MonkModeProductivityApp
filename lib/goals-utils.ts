import type { Goal } from '@/lib/monk-types'

/** Goals with no visible text are treated as unset (legacy apps seeded five empty rows). */
export function filterGoalsWithNonEmptyText(goals: Goal[]): Goal[] {
  return goals.filter((g) => String(g.text ?? '').trim().length > 0)
}
