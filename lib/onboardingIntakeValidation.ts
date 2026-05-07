import type {
  BiggestDistraction,
  ProgramIntakePayload,
  SelectedProgram,
  TransformPrimaryGoal,
} from '@/lib/onboardingProgramFlow'
import { isSelectedProgram } from '@/lib/onboardingProgramFlow'

const PRIMARY_GOALS: readonly TransformPrimaryGoal[] = ['habits', 'stress', 'time', 'project']
const DISTRACTIONS: readonly BiggestDistraction[] = [
  'social_media',
  'email',
  'tv',
  'gaming',
  'news',
  'other',
]

export function pickGoals(body: ProgramIntakePayload): TransformPrimaryGoal[] {
  if (!Array.isArray(body.primary_goal)) return []
  return body.primary_goal.filter(
    (g): g is TransformPrimaryGoal =>
      typeof g === 'string' && (PRIMARY_GOALS as readonly string[]).includes(g),
  )
}

export function pickDistractions(body: ProgramIntakePayload): BiggestDistraction[] {
  if (!Array.isArray(body.biggest_distraction)) return []
  return body.biggest_distraction.filter(
    (g): g is BiggestDistraction =>
      typeof g === 'string' && (DISTRACTIONS as readonly string[]).includes(g),
  )
}

export function validateIntake(body: ProgramIntakePayload): string | null {
  const { selected_program } = body
  if (!isSelectedProgram(selected_program)) return 'Invalid selected_program'

  const acc = body.accountability_preference
  if (acc != null && acc !== 'solo' && acc !== 'buddy' && acc !== 'coach') {
    return 'Invalid accountability_preference'
  }

  const wake = (body.baseline_wake_time ?? '').trim()
  const accReq = acc != null

  if (selected_program === 'sprint_standard') {
    if ((body.one_big_task ?? '').trim().length < 2) return 'one_big_task is required'
    if (!wake) return 'baseline_wake_time is required'
    if (!accReq) return 'accountability_preference is required'
  }

  if (selected_program === 'sprint_monk') {
    if (body.monk_mode_confirmed !== true) return 'monk_mode_confirmed must be true'
    if ((body.one_big_task ?? '').trim().length < 2) return 'one_big_task is required'
    if (!wake) return 'baseline_wake_time is required'
    if (!accReq) return 'accountability_preference is required'
  }

  if (selected_program === 'transform') {
    const goals = pickGoals(body)
    if (!goals.length) return 'primary_goal requires at least one option'
    if (!wake) return 'baseline_wake_time is required'
    const bed = (body.baseline_bed_time ?? '').trim()
    if (!bed) return 'baseline_bed_time is required'
    const same = body.weekend_same_as_weekday === true
    if (!same) {
      if (!(body.weekend_wake_time ?? '').trim()) return 'weekend_wake_time is required when weekends differ'
      if (!(body.weekend_bed_time ?? '').trim()) return 'weekend_bed_time is required when weekends differ'
    }
    const sh = body.sleep_hours_goal
    if (sh == null || sh < 4 || sh > 10) return 'sleep_hours_goal must be between 4 and 10'
    const dist = pickDistractions(body)
    if (!dist.length) return 'biggest_distraction requires at least one option'
    if (!accReq) return 'accountability_preference is required'
  }

  return null
}

function asStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

function asNum(v: unknown): number | null | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
  return v
}

/** Parse string[] from JSON string or array (camelCase or snake_case keys). */
function stringListField(
  raw: Record<string, unknown>,
  camel: string,
  snake: string,
): string[] | null | undefined {
  const v = raw[camel] ?? raw[snake]
  if (v == null) return undefined
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[]
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v) as unknown
      if (Array.isArray(p) && p.every((x) => typeof x === 'string')) return p as string[]
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Build `ProgramIntakePayload` from JSON (supports camelCase fields used by clients
 * and snake_case used by POST /api/onboarding/complete).
 */
export function intakeFromRequestBody(raw: Record<string, unknown>): ProgramIntakePayload | null {
  const program = asStr(raw.programType) ?? asStr(raw.selected_program)
  if (!program || !isSelectedProgram(program)) return null

  const primary = stringListField(raw, 'primaryGoal', 'primary_goal')
  const dist = stringListField(raw, 'biggestDistraction', 'biggest_distraction')

  return {
    selected_program: program as SelectedProgram,
    one_big_task: asStr(raw.oneBigTask) ?? asStr(raw.one_big_task) ?? null,
    baseline_wake_time: asStr(raw.baselineWakeTime) ?? asStr(raw.baseline_wake_time) ?? null,
    accountability_preference: (asStr(raw.accountabilityPreference) ??
      asStr(raw.accountability_preference) ??
      null) as ProgramIntakePayload['accountability_preference'],
    monk_mode_confirmed: asBool(raw.monkModeConfirmed) ?? asBool(raw.monk_mode_confirmed) ?? null,
    deadline_date: asStr(raw.deadlineDate) ?? asStr(raw.deadline_date) ?? null,
    primary_goal: (primary ?? null) as ProgramIntakePayload['primary_goal'],
    baseline_bed_time: asStr(raw.baselineBedTime) ?? asStr(raw.baseline_bed_time) ?? null,
    weekend_same_as_weekday: asBool(raw.weekendSameAsWeekday) ?? asBool(raw.weekend_same_as_weekday) ?? null,
    weekend_wake_time: asStr(raw.weekendWakeTime) ?? asStr(raw.weekend_wake_time) ?? null,
    weekend_bed_time: asStr(raw.weekendBedTime) ?? asStr(raw.weekend_bed_time) ?? null,
    sleep_hours_goal: asNum(raw.sleepHoursGoal) ?? asNum(raw.sleep_hours_goal) ?? null,
    biggest_distraction: (dist ?? null) as ProgramIntakePayload['biggest_distraction'],
  }
}

function padTimeForPg(s: string): string | null {
  const t = s.trim()
  if (!t) return null
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`
  if (/^\d{2}:\d{2}:\d{2}/.test(t)) return t.slice(0, 8)
  return null
}

export function timeFieldsForUserPrograms(body: ProgramIntakePayload): {
  baseline_wake_time: string | null
  baseline_bed_time: string | null
  weekend_wake_time: string | null
  weekend_bed_time: string | null
} {
  const same = body.weekend_same_as_weekday === true
  const wWake = (body.baseline_wake_time ?? '').trim()
  const wBed = (body.baseline_bed_time ?? '').trim()
  return {
    baseline_wake_time: padTimeForPg(body.baseline_wake_time ?? '') ?? null,
    baseline_bed_time: padTimeForPg(body.baseline_bed_time ?? '') ?? null,
    weekend_wake_time: padTimeForPg(
      same ? wWake : (body.weekend_wake_time ?? ''),
    ) ?? null,
    weekend_bed_time: padTimeForPg(
      same ? wBed : (body.weekend_bed_time ?? ''),
    ) ?? null,
  }
}
