import { supabase } from './supabase'

export type LessonPhase = 'student' | 'monk' | 'master'

export type DailyLesson = {
  day: number
  phase: LessonPhase
  title: string
  lesson: string
  action: string
  actionLabel: string
  category: string
  tip?: string
}

function parsePhase(raw: string | null | undefined): LessonPhase {
  if (raw === 'monk' || raw === 'master' || raw === 'student') return raw
  return 'student'
}

const fallbackLesson = (day: number): DailyLesson => ({
  day,
  phase: day <= 30 ? 'student' : 'monk',
  title: `Day ${day}`,
  lesson: `Day ${day} content is being prepared. Check back soon.`,
  action: 'Come back tomorrow.',
  actionLabel: 'See you tomorrow ✓',
  category: 'focus',
})

type LessonRow = {
  day_number: number
  phase: string
  title: string
  lesson: string
  action: string
  action_label: string
  category: string
  tip: string | null
}

function rowToLesson(data: LessonRow): DailyLesson {
  return {
    day: data.day_number,
    phase: parsePhase(data.phase),
    title: data.title,
    lesson: data.lesson,
    action: data.action,
    actionLabel: data.action_label,
    category: data.category,
    tip: data.tip?.trim() ? data.tip : undefined,
  }
}

/** Fetch a single published lesson from Supabase; falls back if missing or error. */
export async function getLessonForDayAsync(day: number): Promise<DailyLesson | null> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('day_number', day)
      .eq('published', true)
      .maybeSingle()

    if (error || !data) {
      console.warn(`No lesson found for day ${day} in database, using fallback`)
      return fallbackLesson(day)
    }

    return rowToLesson(data as LessonRow)
  } catch (err) {
    console.error('getLessonForDayAsync:', err)
    return fallbackLesson(day)
  }
}

/** All lessons (admin; includes drafts). */
export async function getAllLessons(): Promise<DailyLesson[]> {
  try {
    const { data, error } = await supabase.from('lessons').select('*').order('day_number', { ascending: true })

    if (error || !data) return []

    return (data as LessonRow[]).map(rowToLesson)
  } catch (err) {
    console.error('getAllLessons:', err)
    return []
  }
}

/**
 * @deprecated Use getLessonForDayAsync. Sync helper returns null so callers use async path.
 */
export function getLessonForDay(_day: number): DailyLesson | null {
  return null
}
