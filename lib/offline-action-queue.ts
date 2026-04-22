/**
 * Persist failed sync actions in localStorage for replay when the client is back online.
 * Key matches common offline-queue naming: `offline_queue`.
 */

export const OFFLINE_QUEUE_STORAGE_KEY = 'offline_queue'

export type LogHabitPayload = {
  habitId: string
  dateKey: string
  completed: boolean
}

export type OfflineAction =
  | {
      type: 'LOG_HABIT'
      data: LogHabitPayload
    }

function parseQueue(raw: string | null): OfflineAction[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is OfflineAction =>
        x != null &&
        typeof x === 'object' &&
        (x as OfflineAction).type === 'LOG_HABIT' &&
        typeof (x as { data?: unknown }).data === 'object',
    )
  } catch {
    return []
  }
}

export function readOfflineQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return []
  return parseQueue(window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY))
}

export function saveOfflineQueue(actions: OfflineAction[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(actions))
  } catch {
    /* quota / private mode */
  }
}

/** Replace any pending LOG_HABIT for the same habit + date with this payload (latest wins). */
export function enqueueLogHabit(payload: LogHabitPayload): void {
  const prev = readOfflineQueue()
  const filtered = prev.filter((a) => {
    if (a.type !== 'LOG_HABIT') return true
    const d = a.data
    return !(d.habitId === payload.habitId && d.dateKey === payload.dateKey)
  })
  filtered.push({ type: 'LOG_HABIT', data: payload })
  saveOfflineQueue(filtered)
}

export function clearOfflineQueue(): void {
  saveOfflineQueue([])
}
