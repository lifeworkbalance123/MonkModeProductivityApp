import type { TimeSlot } from '@/lib/monk-types'

const KEY = 'monk-dashboard-day-v1'

export type DashboardDayPayload = {
  gratitude: string[]
  achievements: string[]
  timeSlots: TimeSlot[]
}

function readAll(): Record<string, DashboardDayPayload> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as Record<string, Partial<DashboardDayPayload>>
    return p && typeof p === 'object' ? (p as Record<string, DashboardDayPayload>) : {}
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, DashboardDayPayload>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* quota */
  }
}

export function countLocalDashboardDays(): number {
  return Object.keys(readAll()).length
}

export function hasLocalDashboardDay(date: string): boolean {
  return readAll()[date] != null
}

export function loadDayLocal(date: string): DashboardDayPayload | null {
  const m = readAll()[date]
  if (!m) return null
  return {
    gratitude:
      Array.isArray(m.gratitude) && m.gratitude.length === 3
        ? [...m.gratitude]
        : ['', '', ''],
    achievements:
      Array.isArray(m.achievements) && m.achievements.length === 3
        ? [...m.achievements]
        : ['', '', ''],
    timeSlots: Array.isArray(m.timeSlots) ? m.timeSlots : [],
  }
}

export function saveDayLocal(date: string, payload: DashboardDayPayload) {
  const m = readAll()
  m[date] = {
    gratitude: [...payload.gratitude],
    achievements: [...payload.achievements],
    timeSlots: payload.timeSlots.map((s) => ({ ...s })),
  }
  writeAll(m)
}

export function saveDayPartial(date: string, partial: Partial<DashboardDayPayload>) {
  const cur = loadDayLocal(date) ?? {
    gratitude: ['', '', ''],
    achievements: ['', '', ''],
    timeSlots: [] as TimeSlot[],
  }
  saveDayLocal(date, {
    gratitude: partial.gratitude ?? cur.gratitude,
    achievements: partial.achievements ?? cur.achievements,
    timeSlots: partial.timeSlots ?? cur.timeSlots,
  })
}
