'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { TimeSlot } from '@/lib/monk-types'
import { cn } from '@/lib/utils'

/** Category tags for time schedule rows; colorClass matches planner defaults */
export const TIME_SLOT_CATEGORY_OPTIONS: { label: string; colorClass: string }[] =
  [
    { label: 'Personal', colorClass: 'bg-[oklch(0.75_0.12_145)]' },
    { label: 'Work', colorClass: 'bg-[oklch(0.65_0.12_185)]' },
    { label: 'Gym', colorClass: 'bg-[oklch(0.70_0.10_195)]' },
    { label: 'Health', colorClass: 'bg-[oklch(0.72_0.08_285)]' },
    { label: 'Meal', colorClass: 'bg-[oklch(0.80_0.06_310)]' },
    { label: 'Household', colorClass: 'bg-[oklch(0.85_0.18_95)]' },
    { label: 'Pets', colorClass: 'bg-[oklch(0.80_0.15_85)]' },
    { label: 'Study', colorClass: 'bg-[oklch(0.70_0.18_55)]' },
    { label: 'Transport', colorClass: 'bg-[oklch(0.70_0.12_15)]' },
    { label: 'Family', colorClass: 'bg-[oklch(0.70_0.15_250)]' },
    { label: 'Kids', colorClass: 'bg-[oklch(0.65_0.12_220)]' },
  ]

function colorClassForTimeCategory(label: string): string {
  return (
    TIME_SLOT_CATEGORY_OPTIONS.find((c) => c.label === label)?.colorClass ??
    'bg-muted'
  )
}

const TIME_SLOT_ACTIVITY_MIN_CH = 28
const TIME_SLOT_ACTIVITY_MAX_CH = 120

function timeSlotActivityWidthCh(text: string): number {
  const n = text.length + 4
  return Math.min(
    TIME_SLOT_ACTIVITY_MAX_CH,
    Math.max(TIME_SLOT_ACTIVITY_MIN_CH, n),
  )
}

type Props = {
  timeSlots: TimeSlot[]
  onTimeSlotsChange: (next: TimeSlot[]) => void
  /** Show link to weekly planner in the card header */
  showPlannerLink?: boolean
  className?: string
}

export function TimeScheduleCard({
  timeSlots,
  onTimeSlotsChange,
  showPlannerLink = true,
  className,
}: Props) {
  const updateSlot = (
    id: string,
    updates: { time?: string; category?: string; activity?: string },
  ) => {
    onTimeSlotsChange(
      timeSlots.map((s) => {
        if (s.id !== id) return s
        const next = { ...s, ...updates }
        if (updates.category !== undefined) {
          next.colorClass = colorClassForTimeCategory(updates.category)
        }
        return next
      }),
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <span className="font-medium">Time Schedule</span>
        </div>
        {showPlannerLink ? (
          <Link
            href="/planner"
            className="text-xs font-medium text-accent hover:underline shrink-0"
          >
            Weekly habit grid →
          </Link>
        ) : null}
      </div>
      <div className="space-y-1">
        {timeSlots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Input
              value={slot.time}
              onChange={(e) => updateSlot(slot.id, { time: e.target.value })}
              aria-label="Time"
              className="h-8 w-[4.25rem] shrink-0 text-xs px-2 py-1 bg-background/60 border-border"
            />
            <div
              className={`w-1 h-6 rounded-full shrink-0 ${slot.colorClass}`}
            />
            <select
              value={slot.category}
              onChange={(e) =>
                updateSlot(slot.id, { category: e.target.value })
              }
              aria-label="Category"
              className="h-8 max-w-[7.5rem] shrink-0 rounded-md border border-border bg-background/60 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {!TIME_SLOT_CATEGORY_OPTIONS.some(
                (c) => c.label === slot.category,
              ) ? (
                <option value={slot.category}>{slot.category}</option>
              ) : null}
              {TIME_SLOT_CATEGORY_OPTIONS.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
            <div
              className="min-w-[min(100%,28ch)] flex-1 overflow-x-scroll overflow-y-hidden rounded-md border border-border bg-background/60 [scrollbar-width:thin]"
              title="Scroll sideways for longer activity text"
            >
              <Input
                value={slot.activity}
                onChange={(e) =>
                  updateSlot(slot.id, { activity: e.target.value })
                }
                aria-label="Activity"
                style={{
                  width: `${timeSlotActivityWidthCh(slot.activity)}ch`,
                  maxWidth: 'none',
                }}
                className="h-8 w-auto min-w-[28ch] max-w-none shrink-0 border-0 bg-transparent px-2 py-1 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 rounded-none"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
