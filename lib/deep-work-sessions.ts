import { addDays, format, startOfWeek } from 'date-fns'

export type DeepWorkSessionResult = 'crushed' | 'progress' | 'distracted'

export type DeepWorkSession = {
  id: string
  user_id: string
  date: string
  task_name: string
  duration_minutes: number
  completed: boolean
  result: DeepWorkSessionResult | null
  sprint_number: number
  created_at: string
}

export const DEEP_WORK_SESSIONS_LOCAL_KEY = 'monk_deep_work_sessions_v1'

function isValidSession(row: unknown): row is DeepWorkSession {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  const res = r.result
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.date === 'string' &&
    typeof r.task_name === 'string' &&
    typeof r.duration_minutes === 'number' &&
    typeof r.completed === 'boolean' &&
    (res === null ||
      res === 'crushed' ||
      res === 'progress' ||
      res === 'distracted') &&
    typeof r.sprint_number === 'number' &&
    typeof r.created_at === 'string'
  )
}

export function loadDeepWorkSessionsLocal(): DeepWorkSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEEP_WORK_SESSIONS_LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidSession)
  } catch {
    return []
  }
}

export function saveDeepWorkSessionsLocal(sessions: DeepWorkSession[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEEP_WORK_SESSIONS_LOCAL_KEY, JSON.stringify(sessions))
  } catch {
    /* quota */
  }
}

export function appendDeepWorkSessionLocal(session: DeepWorkSession) {
  const prev = loadDeepWorkSessionsLocal()
  saveDeepWorkSessionsLocal([...prev, session])
}

export function newDeepWorkSessionId(useUuid: boolean): string {
  if (useUuid && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `dw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function minutesDeepWorkForDate(
  sessions: DeepWorkSession[],
  dateKey: string,
): number {
  return sessions
    .filter((s) => s.date === dateKey)
    .reduce((a, s) => a + s.duration_minutes, 0)
}

export function minutesDeepWorkThisWeek(
  sessions: DeepWorkSession[],
  now: Date = new Date(),
): number {
  const mon = startOfWeek(now, { weekStartsOn: 1 })
  let total = 0
  for (let i = 0; i < 7; i++) {
    const d = format(addDays(mon, i), 'yyyy-MM-dd')
    total += minutesDeepWorkForDate(sessions, d)
  }
  return total
}

export function bestDeepWorkDayLabel(
  sessions: DeepWorkSession[],
): string | null {
  if (sessions.length === 0) return null
  const byDate = new Map<string, number>()
  for (const s of sessions) {
    byDate.set(s.date, (byDate.get(s.date) ?? 0) + s.duration_minutes)
  }
  let bestDate = ''
  let bestMin = 0
  for (const [date, min] of byDate) {
    if (min > bestMin) {
      bestMin = min
      bestDate = date
    }
  }
  if (!bestDate || bestMin === 0) return null
  try {
    const d = new Date(bestDate + 'T12:00:00')
    const label = format(d, 'EEE MMM d')
    const hrs = (bestMin / 60).toFixed(1).replace(/\.0$/, '')
    return `${label} (${hrs}h)`
  } catch {
    return `${bestDate}`
  }
}

export function formatMinutesAsHours(mins: number): string {
  if (mins <= 0) return '0 hrs'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`
  return `${h}h ${m}m`
}
