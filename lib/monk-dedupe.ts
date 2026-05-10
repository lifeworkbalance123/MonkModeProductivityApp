import type { Goal, Habit, HabitLog, MonkData } from '@/lib/monk-types'

/** Keeps first occurrence when the same `id` appears twice (bad merges / double sync). */
export function dedupeHabitsById(habits: Habit[]): Habit[] {
  const seen = new Set<string>()
  const out: Habit[] = []
  for (const h of habits) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    out.push(h)
  }
  return out
}

/** Keeps first occurrence when the same `id` appears twice. */
export function dedupeGoalsById(goals: Goal[]): Goal[] {
  const seen = new Set<string>()
  const out: Goal[] = []
  for (const g of goals) {
    if (seen.has(g.id)) continue
    seen.add(g.id)
    out.push(g)
  }
  return out
}

/**
 * Drops habits that share the same normalized name as an earlier row (legacy double-seed /
 * “default habits” on top of demos). Merges completion keys into the kept habit id.
 */
export function dedupeMonkHabitsByNormalizedName(data: MonkData): MonkData {
  const habitsIn = dedupeHabitsById(data.habits)
  const habitLog: HabitLog = { ...data.habitLog }
  const seenName = new Map<string, string>()
  const out: Habit[] = []

  for (const h of habitsIn) {
    const key = h.name.trim().toLowerCase()
    if (!key) {
      out.push(h)
      continue
    }
    const keptId = seenName.get(key)
    if (keptId) {
      const dropLog = habitLog[h.id]
      if (dropLog) {
        const keepLog = { ...(habitLog[keptId] ?? {}) }
        for (const [date, done] of Object.entries(dropLog)) {
          if (done) keepLog[date] = true
        }
        habitLog[keptId] = keepLog
        delete habitLog[h.id]
      } else {
        delete habitLog[h.id]
      }
      continue
    }
    seenName.set(key, h.id)
    out.push(h)
  }

  return { ...data, habits: out, habitLog }
}

/** Drops goals with duplicate normalized text; merges `completed` with OR. */
export function dedupeGoalsByNormalizedText(goals: Goal[]): Goal[] {
  const goalsIn = dedupeGoalsById(goals)
  const seen = new Map<string, Goal>()
  const out: Goal[] = []

  for (const g of goalsIn) {
    const key = String(g.text ?? '').trim().toLowerCase()
    if (!key) continue
    const existing = seen.get(key)
    if (existing) {
      if (g.completed) existing.completed = true
      continue
    }
    const row = { ...g }
    seen.set(key, row)
    out.push(row)
  }

  return out
}

export function dedupeMonkGoalsByNormalizedText(data: MonkData): MonkData {
  return { ...data, goals: dedupeGoalsByNormalizedText(data.goals) }
}

/** Id-safe dedupe + legacy duplicate-name cleanup for habits and goals. */
export function sanitizeMonkDuplicates(data: MonkData): MonkData {
  return dedupeMonkGoalsByNormalizedText(dedupeMonkHabitsByNormalizedName(data))
}
