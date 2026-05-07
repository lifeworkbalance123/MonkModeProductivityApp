/**
 * Lightweight local stats for Focus page (Pomodoro completions today).
 * Does not replace server-side analytics.
 */

const STATS_KEY = 'monk_focus_stats_v1'

export type FocusLocalStats = {
  /** yyyy-MM-dd in local calendar */
  dayKey: string
  /** Completed work phases today */
  pomodoroWorkCompletions: number
}

function localDayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function loadFocusLocalStats(): FocusLocalStats {
  if (typeof window === 'undefined') {
    return { dayKey: '', pomodoroWorkCompletions: 0 }
  }
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    if (!raw) return { dayKey: localDayKey(), pomodoroWorkCompletions: 0 }
    const p = JSON.parse(raw) as Partial<FocusLocalStats>
    const today = localDayKey()
    if (p.dayKey !== today) {
      return { dayKey: today, pomodoroWorkCompletions: 0 }
    }
    return {
      dayKey: today,
      pomodoroWorkCompletions: Math.max(0, Number(p.pomodoroWorkCompletions) || 0),
    }
  } catch {
    return { dayKey: localDayKey(), pomodoroWorkCompletions: 0 }
  }
}

export function recordPomodoroWorkCompletion(): FocusLocalStats {
  const cur = loadFocusLocalStats()
  const next: FocusLocalStats = {
    dayKey: cur.dayKey || localDayKey(),
    pomodoroWorkCompletions: cur.pomodoroWorkCompletions + 1,
  }
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}
