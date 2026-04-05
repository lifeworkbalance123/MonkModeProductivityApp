import type { MonkData } from '@/lib/monk-types'

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
  goals: [
    { id: 'g1', text: 'Finish Governance Course', completed: true },
    { id: 'g2', text: 'Complete Python Module 5', completed: false },
    { id: 'g3', text: 'Apply for 3-5 Jobs', completed: false },
    { id: 'g4', text: 'Charisma Training Video', completed: false },
    { id: 'g5', text: 'Build Productivity App MVP', completed: false },
  ],
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
  timeSlots: [
    {
      id: 't1',
      time: '8:30 AM',
      category: 'Personal',
      activity: 'Morning Routine',
      colorClass: 'bg-[oklch(0.75_0.12_145)]',
    },
    {
      id: 't2',
      time: '9:00 AM',
      category: 'Work',
      activity: 'Deep Work Session',
      colorClass: 'bg-[oklch(0.65_0.12_185)]',
    },
    {
      id: 't3',
      time: '9:30 AM',
      category: 'Work',
      activity: 'Deep Work Session',
      colorClass: 'bg-[oklch(0.65_0.12_185)]',
    },
    {
      id: 't4',
      time: '10:00 AM',
      category: 'Work',
      activity: 'Team Standup',
      colorClass: 'bg-[oklch(0.65_0.12_185)]',
    },
    {
      id: 't5',
      time: '10:30 AM',
      category: 'Work',
      activity: 'Project Planning',
      colorClass: 'bg-[oklch(0.65_0.12_185)]',
    },
    {
      id: 't6',
      time: '11:00 AM',
      category: 'Meal',
      activity: 'Snack Break',
      colorClass: 'bg-[oklch(0.80_0.06_310)]',
    },
    {
      id: 't7',
      time: '11:30 AM',
      category: 'Work',
      activity: 'Code Review',
      colorClass: 'bg-[oklch(0.65_0.12_185)]',
    },
    {
      id: 't8',
      time: '12:00 PM',
      category: 'Meal',
      activity: 'Lunch',
      colorClass: 'bg-[oklch(0.80_0.06_310)]',
    },
  ],
  habitLog: {},
}

function mergeLoaded(raw: string): MonkData {
  const parsed = JSON.parse(raw) as Partial<MonkData>
  return {
    habits:
      Array.isArray(parsed.habits) && parsed.habits.length > 0
        ? parsed.habits
        : defaultMonkData.habits,
    goals:
      Array.isArray(parsed.goals) && parsed.goals.length > 0
        ? parsed.goals
        : defaultMonkData.goals,
    gratitude:
      Array.isArray(parsed.gratitude) && parsed.gratitude.length === 3
        ? parsed.gratitude
        : [...defaultMonkData.gratitude],
    achievements:
      Array.isArray(parsed.achievements) && parsed.achievements.length === 3
        ? parsed.achievements
        : [...defaultMonkData.achievements],
    timeSlots:
      Array.isArray(parsed.timeSlots) && parsed.timeSlots.length > 0
        ? parsed.timeSlots
        : defaultMonkData.timeSlots,
    habitLog:
      parsed.habitLog && typeof parsed.habitLog === 'object'
        ? parsed.habitLog
        : {},
  }
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
