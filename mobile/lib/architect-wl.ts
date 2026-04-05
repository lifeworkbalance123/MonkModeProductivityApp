import AsyncStorage from '@react-native-async-storage/async-storage'
import { HOME_HABITS } from '@/constants/habits'

const KEY = 'monkmode_architect_wl_v1'

export const DEFAULT_HABIT_IDS = HOME_HABITS.map((h) => h.id)

export type ArchitectWLState = {
  /** yyyy-mm-dd for "today" bucket */
  dayKey: string
  completedIds: string[]
  /** Misses from the previous calendar day (shown as L on the scoreboard) */
  lastRollupLosses: number
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function loadArchitectWL(): Promise<ArchitectWLState> {
  const habitCount = DEFAULT_HABIT_IDS.length
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) {
      return { dayKey: todayKey(), completedIds: [], lastRollupLosses: 0 }
    }
    const parsed = JSON.parse(raw) as ArchitectWLState
    const now = todayKey()
    if (parsed.dayKey === now) {
      return {
        dayKey: parsed.dayKey,
        completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
        lastRollupLosses:
          typeof parsed.lastRollupLosses === 'number' ? parsed.lastRollupLosses : 0,
      }
    }
    const missed = habitCount - (parsed.completedIds?.length ?? 0)
    const next: ArchitectWLState = {
      dayKey: now,
      completedIds: [],
      lastRollupLosses: Math.max(0, missed),
    }
    await saveArchitectWL(next)
    return next
  } catch {
    return { dayKey: todayKey(), completedIds: [], lastRollupLosses: 0 }
  }
}

export async function saveArchitectWL(state: ArchitectWLState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state))
}

export async function toggleArchitectHabit(habitId: string): Promise<ArchitectWLState> {
  let state = await loadArchitectWL()
  const set = new Set(state.completedIds)
  if (set.has(habitId)) set.delete(habitId)
  else set.add(habitId)
  state = { ...state, completedIds: [...set] }
  await saveArchitectWL(state)
  return state
}
