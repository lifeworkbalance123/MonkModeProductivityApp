/** Shared preset table for Pomodoro work/break lengths (used by `pomodoro-timer-card`). */

export type PomodoroPresetId = 'p25' | 'p50' | 'p90'

export const POMODORO_PRESETS: ReadonlyArray<{
  id: PomodoroPresetId
  label: string
  workMin: number
  breakMin: number
}> = [
  { id: 'p25', label: '25 min', workMin: 25, breakMin: 5 },
  { id: 'p50', label: '50 min', workMin: 50, breakMin: 10 },
  { id: 'p90', label: '90 min', workMin: 90, breakMin: 15 },
]

export function presetIdFromTotals(
  workSec: number,
  breakSec: number,
): PomodoroPresetId | null {
  const match = POMODORO_PRESETS.find((p) => p.workMin * 60 === workSec && p.breakMin * 60 === breakSec)
  return match?.id ?? null
}
