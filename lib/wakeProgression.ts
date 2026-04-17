import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programUtils'

function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

function minutesToTime(minutes: number): string {
  const totalMins = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function getWakeTarget(
  baselineWake: string,
  programDay: number,
  programType: ProgramType,
): string {
  if (programType !== 'transform' || !baselineWake) {
    return baselineWake
  }

  const baseMinutes = timeToMinutes(baselineWake)
  const weekNumber = Math.floor((programDay - 1) / 7)
  const minutesEarlier = Math.min(weekNumber * 15, 90)
  return minutesToTime(baseMinutes - minutesEarlier)
}

export async function getTodayWakeTarget(
  userId: string,
  programDay: number,
  programType: ProgramType,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('program_enrollments')
      .select('baseline_wake_time')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data?.baseline_wake_time) return null
    return getWakeTarget(data.baseline_wake_time, programDay, programType)
  } catch {
    return null
  }
}

export function getWakeComparisonMessage(
  loggedTime: string,
  targetTime: string,
): {
  onTrack: boolean
  message: string
  minutesDiff: number
} {
  const logged = timeToMinutes(loggedTime)
  const target = timeToMinutes(targetTime)
  const diff = logged - target

  if (diff <= 0) {
    return {
      onTrack: true,
      message: diff === 0 ? 'Perfect - right on target!' : `${Math.abs(diff)} min ahead of target. Excellent!`,
      minutesDiff: diff,
    }
  }

  if (diff <= 15) {
    return {
      onTrack: true,
      message: `${diff} min after target - still great.`,
      minutesDiff: diff,
    }
  }

  return {
    onTrack: false,
    message: `Try ${diff} min earlier tomorrow to hit your target of ${targetTime}.`,
    minutesDiff: diff,
  }
}

export async function saveWakeTarget(
  userId: string,
  programDay: number,
  programType: ProgramType,
  targetTime: string,
): Promise<boolean> {
  const { error } = await supabase.from('wake_targets').upsert(
    {
      user_id: userId,
      program_day: programDay,
      program_type: programType,
      target_wake_time: targetTime,
    },
    { onConflict: 'user_id,program_day,program_type' },
  )

  return !error
}
