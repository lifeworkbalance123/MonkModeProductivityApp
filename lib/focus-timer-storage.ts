/**
 * Persist Focus page timers in sessionStorage so they survive client-side navigation
 * (e.g. mobile: leaving /focus for tasks). Countdown uses wall-clock end times.
 */

const POMO_KEY = 'monk_focus_pomodoro_v1'
const DEEP_KEY = 'monk_focus_deep_work_v1'

export type PomodoroPersistedV1 = {
  v: 1
  mode: 'work' | 'break'
  status: 'idle' | 'running' | 'paused'
  wallEndMs: number | null
  pausedSec: number
  /** When set, must match active preset totals for restore (defaults 25 / 5 min). */
  workTotalSec?: number
  breakTotalSec?: number
}

export function loadPomodoro(): PomodoroPersistedV1 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(POMO_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PomodoroPersistedV1
    if (p.v !== 1) return null
    if (p.status !== 'idle' && p.status !== 'running' && p.status !== 'paused') return null
    if (p.mode !== 'work' && p.mode !== 'break') return null
    if (typeof p.pausedSec !== 'number' || p.pausedSec < 0) return null
    if (p.wallEndMs != null && (typeof p.wallEndMs !== 'number' || p.wallEndMs <= 0)) return null
    if (p.workTotalSec != null && (typeof p.workTotalSec !== 'number' || p.workTotalSec < 60)) return null
    if (p.breakTotalSec != null && (typeof p.breakTotalSec !== 'number' || p.breakTotalSec < 60)) return null
    return p
  } catch {
    return null
  }
}

export function savePomodoro(p: PomodoroPersistedV1): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(POMO_KEY, JSON.stringify(p))
  } catch {
    /* quota / private mode */
  }
}

export function clearPomodoro(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(POMO_KEY)
  } catch {
    /* ignore */
  }
}

export type DeepWorkPersistedV1 = {
  v: 1
  status: 'idle' | 'running' | 'paused' | 'break' | 'completed'
  phase: 'sprint' | 'break'
  wallEndMs: number | null
  pausedSec: number
  sprintStartedAtMs: number | null
  sprintTotal: number
  breakTotal: number
}

export function loadDeepWork(): DeepWorkPersistedV1 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DEEP_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as DeepWorkPersistedV1
    if (p.v !== 1) return null
    const okStatus = ['idle', 'running', 'paused', 'break', 'completed'] as const
    if (!okStatus.includes(p.status as (typeof okStatus)[number])) return null
    if (p.phase !== 'sprint' && p.phase !== 'break') return null
    if (typeof p.sprintTotal !== 'number' || typeof p.breakTotal !== 'number') return null
    if (typeof p.pausedSec !== 'number' || p.pausedSec < 0) return null
    if (p.wallEndMs != null && (typeof p.wallEndMs !== 'number' || p.wallEndMs <= 0)) return null
    return p
  } catch {
    return null
  }
}

export function saveDeepWork(p: DeepWorkPersistedV1): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DEEP_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export function clearDeepWork(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DEEP_KEY)
  } catch {
    /* ignore */
  }
}
