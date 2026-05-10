import type { MonkData } from '@/lib/monk-types'
import { filterGoalsWithNonEmptyText } from '@/lib/goals-utils'
import { sanitizeMonkDuplicates } from '@/lib/monk-dedupe'

export const MONK_STORAGE_KEY = 'monk-mode-mvp-v1'

export const defaultMonkData: MonkData = {
  habits: [
    { id: 'h1', name: 'Make bed' },
    { id: 'h2', name: 'Brush teeth' },
    { id: 'h3', name: 'Gratitude journal' },
    { id: 'h4', name: 'Gym' },
    { id: 'h5', name: 'Meditate' },
    { id: 'h6', name: 'Read 30 mins' },
  ],
  goals: [],
  gratitude: [
    'My health and energy today',
    'Supportive family',
    'New opportunities ahead',
  ],
  achievements: [
    'Completed deep work session',
    'Made progress on app',
    'Exercised for 30 minutes',
  ],
  morningVideoUrl: '',
  morningVideoNote: '',
  timeSlots: [],
  habitLog: {},
}

/**
 * Used after Settings → “Reset all data”: empty slate, not the demo copy in {@link defaultMonkData}.
 */
export const emptyMonkDataAfterReset: MonkData = {
  habits: [],
  goals: [],
  gratitude: ['', '', ''],
  achievements: ['', '', ''],
  morningVideoUrl: '',
  morningVideoNote: '',
  timeSlots: [],
  habitLog: {},
}

function mergeLoaded(raw: string): MonkData {
  const parsed = JSON.parse(raw) as Partial<MonkData>
  const merged: MonkData = {
    habits: Array.isArray(parsed.habits)
      ? parsed.habits
      : defaultMonkData.habits,
    goals: Array.isArray(parsed.goals)
      ? (parsed.goals as MonkData['goals'])
      : [],
    gratitude:
      Array.isArray(parsed.gratitude) && parsed.gratitude.length === 3
        ? parsed.gratitude
        : [...defaultMonkData.gratitude],
    achievements:
      Array.isArray(parsed.achievements) && parsed.achievements.length === 3
        ? parsed.achievements
        : [...defaultMonkData.achievements],
    morningVideoUrl:
      typeof parsed.morningVideoUrl === 'string'
        ? parsed.morningVideoUrl
        : defaultMonkData.morningVideoUrl,
    morningVideoNote:
      typeof parsed.morningVideoNote === 'string'
        ? parsed.morningVideoNote
        : defaultMonkData.morningVideoNote,
    timeSlots:
      Array.isArray(parsed.timeSlots) ? parsed.timeSlots : defaultMonkData.timeSlots,
    habitLog:
      parsed.habitLog && typeof parsed.habitLog === 'object'
        ? parsed.habitLog
        : {},
  }
  return sanitizeMonkDuplicates({
    ...merged,
    goals: filterGoalsWithNonEmptyText(merged.goals),
  })
}

export function loadMonk(): MonkData {
  if (typeof window === 'undefined') return defaultMonkData
  try {
    const raw = localStorage.getItem(MONK_STORAGE_KEY)
    if (!raw) return defaultMonkData
    return mergeLoaded(raw)
  } catch {
    return defaultMonkData
  }
}

export function saveMonk(data: MonkData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MONK_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota */
  }
}

export function clearMonk() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MONK_STORAGE_KEY)
}
