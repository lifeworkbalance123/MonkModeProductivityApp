import { supabase } from '@/lib/supabase'
import type { TimeSlot } from '@/lib/monk-types'

export type TemplateBlock = {
  time: string
  category: string
  label: string
}

export type ScheduleTemplate = {
  userId: string
  startTime: string
  incrementMinutes: number
  blockCount: number
  blocks: TemplateBlock[]
}

/** Tailwind colour classes — matches `TIME_SLOT_CATEGORY_OPTIONS` / `planner_slots.colour`. */
export function categoryToColorClass(category: string): string {
  const map: Record<string, string> = {
    Work: 'bg-blue-500',
    Personal: 'bg-green-500',
    Gym: 'bg-orange-500',
    Health: 'bg-pink-500',
    Meal: 'bg-purple-500',
    Study: 'bg-yellow-500',
    Family: 'bg-red-500',
    Household: 'bg-neutral-500',
    Pets: 'bg-teal-500',
    Transport: 'bg-indigo-500',
  }
  return map[category] ?? 'bg-muted'
}

export function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = (h * 60 + m + minutes) % 1440
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
}

function minutesFromHHmm(time: string): number {
  const parts = time.trim().split(':')
  if (parts.length < 2) return 0
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

function inferIncrementMinutes(sorted: TimeSlot[]): 15 | 30 | 60 {
  if (sorted.length < 2) return 60
  const d = minutesFromHHmm(sorted[1].time) - minutesFromHHmm(sorted[0].time)
  const diff = ((d % 1440) + 1440) % 1440
  if (diff <= 0) return 60
  if (diff <= 22) return 15
  if (diff <= 45) return 30
  return 60
}

/** Build UI rows from stored weekly template (new ids each call — use for load/display). */
export function timeSlotsFromTemplate(template: ScheduleTemplate): TimeSlot[] {
  return template.blocks.map((b) => ({
    id: crypto.randomUUID(),
    time: b.time,
    category: b.category,
    activity: b.label,
    colorClass: categoryToColorClass(b.category),
  }))
}

/** Serialize dashboard / planner time rows into one weekly template row. */
export function scheduleTemplateFromTimeSlots(
  userId: string,
  slots: TimeSlot[],
): ScheduleTemplate {
  if (slots.length === 0) {
    return {
      userId,
      startTime: '05:00',
      incrementMinutes: 60,
      blockCount: 8,
      blocks: [],
    }
  }
  const sorted = [...slots].sort(
    (a, b) => minutesFromHHmm(a.time) - minutesFromHHmm(b.time),
  )
  const blocks: TemplateBlock[] = sorted.map((s) => ({
    time: s.time,
    category: s.category,
    label: s.activity,
  }))
  const incrementMinutes = inferIncrementMinutes(sorted)
  return {
    userId,
    startTime: sorted[0]?.time ?? '05:00',
    incrementMinutes,
    blockCount: Math.max(1, Math.min(20, blocks.length)),
    blocks,
  }
}

export function generateBlocks(
  startTime: string,
  incrementMinutes: number,
  blockCount: number,
  existingBlocks?: TemplateBlock[],
): TemplateBlock[] {
  return Array.from({ length: blockCount }, (_, i) => {
    const time = addMinutes(startTime, i * incrementMinutes)
    const existing = existingBlocks?.find((b) => b.time === time)
    return (
      existing || {
        time,
        category: 'Work',
        label: '',
      }
    )
  })
}

export async function getTemplate(userId: string): Promise<ScheduleTemplate | null> {
  const { data, error } = await supabase
    .from('schedule_templates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('getTemplate', error)
    return null
  }
  if (!data) return null

  const blocks = Array.isArray(data.blocks) ? (data.blocks as TemplateBlock[]) : []

  return {
    userId: data.user_id,
    startTime: data.start_time,
    incrementMinutes: data.increment_minutes,
    blockCount: data.block_count,
    blocks,
  }
}

export async function saveTemplate(template: ScheduleTemplate): Promise<boolean> {
  const { error } = await supabase.from('schedule_templates').upsert(
    {
      user_id: template.userId,
      start_time: template.startTime,
      increment_minutes: template.incrementMinutes,
      block_count: template.blockCount,
      blocks: template.blocks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('saveTemplate', error)
    return false
  }
  return true
}

export async function getSlotsForDate(userId: string, date: string) {
  const { data, error } = await supabase
    .from('planner_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('time_slot', { ascending: true })

  if (error) {
    console.error('getSlotsForDate', error)
    return []
  }
  return data ?? []
}

export async function applyTemplateToDate(
  userId: string,
  date: string,
  template: ScheduleTemplate,
  overwrite: boolean = false,
): Promise<boolean> {
  if (!overwrite) {
    const existing = await getSlotsForDate(userId, date)
    if (existing.length > 0) return true
  }

  if (overwrite) {
    const { error: delErr } = await supabase
      .from('planner_slots')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
    if (delErr) {
      console.error('applyTemplateToDate delete', delErr)
      return false
    }
  }

  const slots = template.blocks.map((block) => ({
    user_id: userId,
    date,
    time_slot: block.time,
    activity: block.label || '',
    category: block.category,
    colour: categoryToColorClass(block.category),
  }))

  if (slots.length === 0) return true

  const { error } = await supabase.from('planner_slots').upsert(slots, {
    onConflict: 'user_id,date,time_slot',
  })

  if (error) {
    console.error('applyTemplateToDate upsert', error)
    return false
  }
  return true
}

export async function applyTemplateToWeek(
  userId: string,
  weekStartDate: string,
  template: ScheduleTemplate,
  overwrite: boolean = false,
): Promise<boolean> {
  const start = new Date(weekStartDate + 'T12:00:00')

  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().slice(0, 10)
    const ok = await applyTemplateToDate(userId, dateStr, template, overwrite)
    if (!ok) return false
  }
  return true
}
