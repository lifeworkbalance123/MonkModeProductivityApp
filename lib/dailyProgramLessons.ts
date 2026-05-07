import type { DailyLesson } from '@/lib/lessonContent'
import { inlineBonusTrackHasContent } from '@/lib/lessonContent'
import { inferMediaFromAudioVideoUrls } from '@/lib/program-lesson-media'
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
  /** Primary row: false. Optional bonus for the same calendar day: true. */
  is_bonus?: boolean
  parent_day_number?: number | null
  phase: number
  title: string
  content_markdown: string
  audio_url: string | null
  video_url: string | null
  tip_topic: string | null
  /** Inline bonus section (stored on primary rows only). */
  bonus_label?: string | null
  bonus_title?: string | null
  bonus_body?: string | null
  bonus_audio_url?: string | null
  bonus_video_url?: string | null
  created_at: string
  updated_at: string
}

export function isDailyProgramLessonType(t: ProgramType): t is DailyProgramLessonType {
  return t === 'sprint_standard' || t === 'sprint_monk' || t === 'transform' || t === 'mastery'
}

export function rowHasInlineBonusTrack(row: DailyProgramLessonRow): boolean {
  return inlineBonusTrackHasContent(row)
}

function mapProgramRowToDailyLesson(day: number, row: DailyProgramLessonRow): DailyLesson {
  const media = inferMediaFromAudioVideoUrls(row.audio_url, row.video_url)
  const base: DailyLesson = {
    day,
    phase: 'student',
    title: row.title,
    lesson: row.content_markdown,
    action: '',
    actionLabel: '',
    category: 'focus',
    tip: row.tip_topic ?? undefined,
    media_type: media.media_type ?? null,
    media_url: media.media_url ?? null,
    secondary_audio_url: media.secondary_audio_url ?? null,
    isBonus: !!(row.is_bonus ?? false),
  }
  if (row.is_bonus ?? false) {
    return base
  }
  return {
    ...base,
    bonus_label: row.bonus_label ?? undefined,
    bonus_title: row.bonus_title ?? undefined,
    bonus_body: row.bonus_body ?? undefined,
    bonus_audio_url: row.bonus_audio_url ?? undefined,
    bonus_video_url: row.bonus_video_url ?? undefined,
  }
}

/** Inline bonus fields on the primary `daily_lessons` row → lesson tab payload. */
export function mapInlineBonusTrackToDailyLesson(
  day: number,
  primaryRow: DailyProgramLessonRow,
): DailyLesson | null {
  if (!rowHasInlineBonusTrack(primaryRow)) return null
  const label = primaryRow.bonus_label?.trim()
  const title = primaryRow.bonus_title?.trim() || label || 'Bonus'
  const media = inferMediaFromAudioVideoUrls(
    primaryRow.bonus_audio_url,
    primaryRow.bonus_video_url,
  )
  return {
    day,
    phase: 'student',
    title,
    lesson: primaryRow.bonus_body?.trim() ?? '',
    action: '',
    actionLabel: '',
    category: 'focus',
    tip: undefined,
    media_type: media.media_type ?? null,
    media_url: media.media_url ?? null,
    secondary_audio_url: media.secondary_audio_url ?? null,
    isBonus: true,
  }
}

export function bonusTabLabelForProgramLesson(
  primaryRow: DailyProgramLessonRow,
  legacyBonusRow: DailyProgramLessonRow | null,
): string {
  if (rowHasInlineBonusTrack(primaryRow)) {
    return primaryRow.bonus_label?.trim() || 'Bonus'
  }
  if (legacyBonusRow) {
    return 'Bonus'
  }
  return 'Bonus'
}

/** Prefer inline bonus columns on the primary row; otherwise legacy `is_bonus` row. */
export async function getDailyProgramBonusLessonForDay(
  programType: ProgramType,
  programDay: number,
): Promise<{ lesson: DailyLesson | null; tabLabel: string }> {
  if (!isDailyProgramLessonType(programType)) {
    return { lesson: null, tabLabel: 'Bonus' }
  }
  const max = getMaxDays(programType)
  const day = Math.min(Math.max(1, Math.floor(programDay)), max)

  try {
    const { data: primary, error: pErr } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('program_type', programType)
      .eq('program_day', day)
      .eq('is_bonus', false)
      .maybeSingle()

    if (pErr || !primary) return { lesson: null, tabLabel: 'Bonus' }

    const prow = primary as DailyProgramLessonRow
    const inline = mapInlineBonusTrackToDailyLesson(day, prow)
    if (inline) {
      return {
        lesson: inline,
        tabLabel: bonusTabLabelForProgramLesson(prow, null),
      }
    }

    const { data: legacy, error: lErr } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('program_type', programType)
      .eq('program_day', day)
      .eq('is_bonus', true)
      .maybeSingle()

    if (lErr || !legacy) return { lesson: null, tabLabel: 'Bonus' }

    const lrow = legacy as DailyProgramLessonRow
    return {
      lesson: mapProgramRowToDailyLesson(day, lrow),
      tabLabel: bonusTabLabelForProgramLesson(prow, lrow),
    }
  } catch {
    return { lesson: null, tabLabel: 'Bonus' }
  }
}

/** CMS primary row → Today card payload (includes audio/video when set). */
export function dailyLessonFromPrimaryProgramRow(
  day: number,
  row: DailyProgramLessonRow,
): DailyLesson {
  return mapProgramRowToDailyLesson(day, row)
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
      .eq('is_bonus', false)
      .maybeSingle()

    if (error || !data) return null
    return data as DailyProgramLessonRow
  } catch {
    return null
  }
}
