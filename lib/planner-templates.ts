import type { TimeSlot } from '@/lib/monk-types'
import { TIME_SLOT_CATEGORY_OPTIONS } from '@/components/time-schedule-card'

function cat(label: string) {
  return (
    TIME_SLOT_CATEGORY_OPTIONS.find((c) => c.label === label) ??
    TIME_SLOT_CATEGORY_OPTIONS[0]
  )
}

/** Default 5:00–9:00 AM morning routine blocks for schedule / planner empty states. */
export function morningRoutineTemplateSlots(newId: () => string): TimeSlot[] {
  const rows: { time: string; category: string; activity: string }[] = [
    { time: '05:00', category: 'Personal', activity: 'Wake + hydrate' },
    { time: '05:30', category: 'Personal', activity: 'Meditate / breathwork' },
    { time: '06:00', category: 'Health', activity: 'Movement or walk' },
    { time: '07:00', category: 'Meal', activity: 'Breakfast + plan day' },
    { time: '08:00', category: 'Work', activity: 'Deep work block 1' },
    { time: '09:00', category: 'Work', activity: 'Email + handoffs' },
  ]
  return rows.map((r) => {
    const c = cat(r.category)
    return {
      id: newId(),
      time: r.time,
      category: c.label,
      activity: r.activity,
      colorClass: c.colorClass,
    }
  })
}
