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
  media_type?: string | null
  media_url?: string | null
  isBonus?: boolean
}

function parsePhase(raw: string | null | undefined): LessonPhase {
  if (raw === 'monk' || raw === 'master' || raw === 'student') return raw
  return 'student'
}

const fallbackLesson = (day: number): DailyLesson => ({
  day,
  phase: day <= 30 ? 'student' : day <= 60 ? 'monk' : 'master',
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
  is_bonus?: boolean | null
  media_type?: string | null
  media_url?: string | null
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
    media_type: data.media_type ?? null,
    media_url: data.media_url ?? null,
    isBonus: !!data.is_bonus,
  }
}

export type PublishedLessonsForDay = {
  primary: DailyLesson
  bonus: DailyLesson | null
}

/** Primary (+ optional bonus) published lessons for a calendar day. */
export async function getPublishedLessonsForDayAsync(day: number): Promise<PublishedLessonsForDay> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('day_number', day)
      .eq('published', true)
      .order('is_bonus', { ascending: true })

    if (error || !data?.length) {
      const fb = fallbackLesson(day)
      return { primary: fb, bonus: null }
    }

    const rows = data as LessonRow[]
    const primaryRow = rows.find((r) => !r.is_bonus)
    const bonusRow = rows.find((r) => r.is_bonus)

    const primary = primaryRow ? rowToLesson(primaryRow) : fallbackLesson(day)
    const bonus = bonusRow ? rowToLesson(bonusRow) : null

    return { primary, bonus }
  } catch (err) {
    console.error('getPublishedLessonsForDayAsync:', err)
    const fb = fallbackLesson(day)
    return { primary: fb, bonus: null }
  }
}

/** Fetch a single published primary lesson from Supabase; falls back if missing or error. */
export async function getLessonForDayAsync(day: number): Promise<DailyLesson | null> {
  const { primary } = await getPublishedLessonsForDayAsync(day)
  return primary
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
