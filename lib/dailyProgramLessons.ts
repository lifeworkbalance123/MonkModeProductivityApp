import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programUtils'
import { getMaxDays } from '@/lib/programUtils'

export type DailyProgramLessonType = Exclude<
  ProgramType,
  '60day'
>

export type DailyProgramLessonRow = {
  id: string
  program_type: DailyProgramLessonType
  program_day: number
  phase: number
  title: string
  content_markdown: string
  audio_url: string | null
  video_url: string | null
  tip_topic: string | null
  created_at: string
  updated_at: string
}

export function isDailyProgramLessonType(t: ProgramType): t is DailyProgramLessonType {
  return t === 'sprint_standard' || t === 'sprint_monk' || t === 'transform' || t === 'mastery'
}

/** Fetch the CMS row for a user program day, or null if missing / wrong type. */
export async function getDailyProgramLessonForDay(
  programType: ProgramType,
  programDay: number,
): Promise<DailyProgramLessonRow | null> {
  if (!isDailyProgramLessonType(programType)) return null
  const max = getMaxDays(programType)
  const day = Math.min(Math.max(1, Math.floor(programDay)), max)

  try {
    const { data, error } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('program_type', programType)
      .eq('program_day', day)
      .maybeSingle()

    if (error || !data) return null
    return data as DailyProgramLessonRow
  } catch {
    return null
  }
}
