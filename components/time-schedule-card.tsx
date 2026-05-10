'use client'

import Link from 'next/link'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { addMinutes, format, parse } from 'date-fns'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import type { TimeSlot } from '@/lib/monk-types'
import { cn } from '@/lib/utils'

const LS_INCREMENT = 'monk_schedule_time_increment'

export type TimeScheduleIncrement = 15 | 30 | 60

const INCREMENT_OPTIONS: { value: TimeScheduleIncrement; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
]

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Category options with Tailwind colour chips (dashboard / planner). */
export const TIME_SLOT_CATEGORY_OPTIONS: { label: string; colorClass: string }[] =
  [
    { label: 'Work', colorClass: 'bg-blue-500' },
    { label: 'Personal', colorClass: 'bg-green-500' },
    { label: 'Gym', colorClass: 'bg-orange-500' },
    { label: 'Health', colorClass: 'bg-pink-500' },
    { label: 'Meal', colorClass: 'bg-purple-500' },
    { label: 'Study', colorClass: 'bg-yellow-500' },
    { label: 'Family', colorClass: 'bg-red-500' },
    { label: 'Household', colorClass: 'bg-neutral-500' },
    { label: 'Pets', colorClass: 'bg-teal-500' },
    { label: 'Transport', colorClass: 'bg-indigo-500' },
  ]

const LEGACY_CATEGORY_COLOR: Record<string, string> = {
  Kids: 'bg-red-400',
}

function colorClassForTimeCategory(label: string): string {
  return (
    TIME_SLOT_CATEGORY_OPTIONS.find((c) => c.label === label)?.colorClass ??
    LEGACY_CATEGORY_COLOR[label] ??
    'bg-muted'
  )
}

function readStoredIncrement(): TimeScheduleIncrement {
  if (typeof window === 'undefined') return 30
  try {
    const v = localStorage.getItem(LS_INCREMENT)
    if (v === '15' || v === '30' || v === '60') return Number(v) as TimeScheduleIncrement
  } catch {
    /* ignore */
  }
  return 30
}

function buildTimeOptions(incrementMinutes: TimeScheduleIncrement): {
  value: string
  label: string
}[] {
  const base = new Date(2000, 0, 1, 5, 0, 0)
  const end = new Date(2000, 0, 2, 0, 0, 0)
  const out: { value: string; label: string }[] = []
  for (let d = base; d < end; d = addMinutes(d, incrementMinutes)) {
    out.push({
      value: format(d, 'HH:mm'),
      label: format(d, 'h:mm a'),
    })
  }
  return out
}

function minutesFromHHmm(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

function nearestTimeOption(
  hhmm: string,
  options: { value: string; label: string }[],
): string {
  if (options.length === 0) return hhmm
  const tm = minutesFromHHmm(hhmm)
  let best = options[0].value
  let bestD = Infinity
  for (const o of options) {
    const d = Math.abs(minutesFromHHmm(o.value) - tm)
    if (d < bestD) {
      bestD = d
      best = o.value
    }
  }
  return best
}

/** Map free-text or legacy values onto HH:mm when possible. */
function coerceTimeValue(raw: string, options: { value: string; label: string }[]): string {
  const t = raw.trim()
  if (!t) return options[0]?.value ?? '09:00'
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(':').map(Number)
    const hh = String(Math.min(23, Math.max(0, h))).padStart(2, '0')
    const mm = String(Math.min(59, Math.max(0, m))).padStart(2, '0')
    const key = `${hh}:${mm}`
    if (options.some((o) => o.value === key)) return key
    return nearestTimeOption(key, options)
  }
  try {
    const parsed = parse(t, 'h:mm a', new Date(2000, 0, 1))
    if (!Number.isNaN(parsed.getTime())) {
      const key = format(parsed, 'HH:mm')
      if (options.some((o) => o.value === key)) return key
      return nearestTimeOption(key, options)
    }
  } catch {
    /* ignore */
  }
  return options[0]?.value ?? '09:00'
}

type RepeatPref = { enabled: boolean; days: number[] }

export type TimeSlotsChange =
  | TimeSlot[]
  | ((prev: TimeSlot[]) => TimeSlot[])

const TimeScheduleSlotRow = memo(function TimeScheduleSlotRow({
  slot,
  coerced,
  timeOptions,
  repeat,
  updateSlot,
  deleteSlot,
  onApplyTimeBlockToWeek,
  setRepeatEnabled,
  toggleRepeatDay,
  applyRepeat,
}: {
  slot: TimeSlot
  coerced: string
  timeOptions: { value: string; label: string }[]
  repeat: RepeatPref
  updateSlot: (
    id: string,
    updates: { time?: string; category?: string; activity?: string },
  ) => void
  deleteSlot: (id: string) => void
  onApplyTimeBlockToWeek?: (
    block: Pick<TimeSlot, 'time' | 'category' | 'activity' | 'colorClass'>,
    dayIndices: number[],
  ) => Promise<{ error: string | null }>
  setRepeatEnabled: (id: string, enabled: boolean) => void
  toggleRepeatDay: (id: string, dayIndex: number) => void
  applyRepeat: (slot: TimeSlot) => void | Promise<void>
}) {
  const [draftActivity, setDraftActivity] = useState(slot.activity)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (focused) return
    setDraftActivity(slot.activity)
  }, [slot.activity, focused])

  const commitActivity = useCallback(() => {
    const next = draftActivity
    if (next === slot.activity) return
    updateSlot(slot.id, { activity: next })
  }, [draftActivity, slot.activity, slot.id, updateSlot])

  return (
    <div className="rounded-lg border border-border bg-muted/25 p-1 space-y-1">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
        <select
          value={coerced}
          onChange={(e) => updateSlot(slot.id, { time: e.target.value })}
          aria-label="Time"
          className="h-7 w-full shrink-0 rounded-md border border-border bg-input px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring md:w-[7.25rem]"
        >
          {!timeOptions.some((o) => o.value === slot.time) ? (
            <option value={slot.time}>{slot.time}</option>
          ) : null}
          {timeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:shrink-0 md:flex-row md:items-center md:gap-2">
          <div
            className={`h-6 w-1 shrink-0 rounded-full max-md:hidden md:block ${slot.colorClass}`}
            aria-hidden
          />
          <div
            className={`h-1 w-6 shrink-0 rounded-full md:hidden ${slot.colorClass}`}
            aria-hidden
          />
          <select
            value={slot.category}
            onChange={(e) =>
              updateSlot(slot.id, { category: e.target.value })
            }
            aria-label="Category"
            className="h-7 w-full min-w-0 flex-1 rounded-md border border-border bg-input px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring md:max-w-[9rem] md:flex-none md:shrink-0"
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
        </div>
        <div
          className="min-w-0 w-full rounded-md border border-border bg-input md:flex-1 md:overflow-x-auto md:overflow-y-hidden md:[scrollbar-width:thin]"
          title="Scroll sideways for longer activity text (desktop)"
        >
          <Input
            value={draftActivity}
            onChange={(e) => setDraftActivity(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              commitActivity()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              } else if (e.key === 'Escape') {
                setDraftActivity(slot.activity)
                e.currentTarget.blur()
              }
            }}
            aria-label="Activity"
            className="time-schedule-activity-input h-7 w-full min-w-[28ch] border-0 bg-transparent px-2 py-1 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 rounded-none md:max-w-none md:shrink-0"
          />
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-1 self-stretch md:w-auto md:justify-start md:self-center">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive h-7 w-7"
            aria-label="Remove time block"
            onClick={() => deleteSlot(slot.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {onApplyTimeBlockToWeek ? (
        <div className="flex flex-col gap-2 border-l-2 border-border pl-2 md:pl-3">
          <div className="flex flex-wrap items-center gap-2">
            <Switch
              id={`repeat-${slot.id}`}
              checked={repeat.enabled}
              onCheckedChange={(v) => setRepeatEnabled(slot.id, v)}
            />
            <Label
              htmlFor={`repeat-${slot.id}`}
              className="text-xs font-normal cursor-pointer"
            >
              Repeat this block on selected days (copies into planner data for
              this week)
            </Label>
          </div>
          {repeat.enabled ? (
            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2">
              <div className="flex flex-wrap gap-2">
                {DAY_SHORT.map((label, i) => (
                  <label
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-input px-2 py-1 text-xs"
                  >
                    <Checkbox
                      checked={repeat.days.includes(i)}
                      onCheckedChange={() => toggleRepeatDay(slot.id, i)}
                      className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full shrink-0 text-xs md:h-8 md:w-auto"
                disabled={repeat.days.length === 0}
                onClick={() => void applyRepeat(slot)}
              >
                Apply to week
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})

type Props = {
  /** Stable list identity for dashboard rows (e.g. yyyy-MM-dd); avoids remounts when slot ids sync. */
  selectedDateKey?: string
  timeSlots: TimeSlot[]
  onTimeSlotsChange: (next: TimeSlotsChange) => void
  /** New row ids (Supabase UUID when synced). */
  getNewSlotId: () => string
  /** When set, “Apply to week” inserts planner rows for signed-in Pro users. */
  onApplyTimeBlockToWeek?: (
    block: Pick<TimeSlot, 'time' | 'category' | 'activity' | 'colorClass'>,
    dayIndices: number[],
  ) => Promise<{ error: string | null }>
  /** Show link to weekly planner in the card header */
  showPlannerLink?: boolean
  /** Optional controls next to the title (e.g. weekly template). */
  headerActions?: ReactNode
  /** Disable adding new blocks (e.g. Free tier cap). */
  addDisabled?: boolean
  /** Called when user attempts to add while disabled. */
  onAddDisabledClick?: () => void
  className?: string
  /** Hide the built-in “Time schedule” heading when wrapped by an outer collapsible title. */
  hideScheduleTitle?: boolean
}

export function TimeScheduleCard({
  selectedDateKey,
  timeSlots,
  onTimeSlotsChange,
  getNewSlotId,
  onApplyTimeBlockToWeek,
  showPlannerLink = true,
  headerActions,
  addDisabled = false,
  onAddDisabledClick,
  className,
  hideScheduleTitle = false,
}: Props) {
  const [increment, setIncrement] = useState<TimeScheduleIncrement>(() =>
    typeof window === 'undefined' ? 30 : readStoredIncrement(),
  )
  const [savedVisible, setSavedVisible] = useState(false)
  const saveFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [repeatPrefs, setRepeatPrefs] = useState<Record<string, RepeatPref>>({})

  const timeOptions = useMemo(
    () => buildTimeOptions(increment),
    [increment],
  )

  const flashSaved = useCallback(() => {
    if (saveFlashTimer.current) clearTimeout(saveFlashTimer.current)
    setSavedVisible(true)
    saveFlashTimer.current = setTimeout(() => {
      setSavedVisible(false)
      saveFlashTimer.current = null
    }, 2000)
  }, [])

  const pushChange = useCallback(
    (next: TimeSlotsChange) => {
      onTimeSlotsChange(next)
      flashSaved()
    },
    [onTimeSlotsChange, flashSaved],
  )

  const setIncrementAndStore = useCallback(
    (nextInc: TimeScheduleIncrement) => {
      setIncrement(nextInc)
      try {
        localStorage.setItem(LS_INCREMENT, String(nextInc))
      } catch {
        /* ignore */
      }
      const nextOptions = buildTimeOptions(nextInc)
      pushChange((prev) => {
        const normalized = prev.map((s) => ({
          ...s,
          time: coerceTimeValue(s.time, nextOptions),
        }))
        return normalized.some((s, i) => s.time !== prev[i].time)
          ? normalized
          : prev
      })
    },
    [pushChange],
  )

  const updateSlot = useCallback(
    (
      id: string,
      updates: { time?: string; category?: string; activity?: string },
    ) => {
      pushChange((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s
          const next = { ...s, ...updates }
          if (updates.category !== undefined) {
            next.colorClass = colorClassForTimeCategory(updates.category)
          }
          if (updates.time !== undefined) {
            next.time = coerceTimeValue(updates.time, timeOptions)
          }
          return next
        }),
      )
    },
    [pushChange, timeOptions],
  )

  const deleteSlot = useCallback(
    (id: string) => {
      setRepeatPrefs((p) => {
        const next = { ...p }
        delete next[id]
        return next
      })
      pushChange((prev) => prev.filter((s) => s.id !== id))
    },
    [pushChange],
  )

  const addEmptyRow = useCallback(() => {
    const first = timeOptions[0]?.value ?? '09:00'
    const cat = TIME_SLOT_CATEGORY_OPTIONS[0]
    pushChange((prev) => [
      ...prev,
      {
        id: getNewSlotId(),
        time: first,
        category: cat.label,
        activity: '',
        colorClass: cat.colorClass,
      },
    ])
  }, [getNewSlotId, pushChange, timeOptions])

  const getRepeat = useCallback(
    (id: string): RepeatPref =>
      repeatPrefs[id] ?? { enabled: false, days: [] },
    [repeatPrefs],
  )

  const setRepeatEnabled = useCallback((id: string, enabled: boolean) => {
    setRepeatPrefs((p) => ({
      ...p,
      [id]: { ...(p[id] ?? { enabled: false, days: [] }), enabled },
    }))
  }, [])

  const toggleRepeatDay = useCallback((id: string, dayIndex: number) => {
    setRepeatPrefs((p) => {
      const cur = p[id] ?? { enabled: false, days: [] }
      const has = cur.days.includes(dayIndex)
      const days = has
        ? cur.days.filter((d) => d !== dayIndex)
        : [...cur.days, dayIndex].sort((a, b) => a - b)
      return { ...p, [id]: { ...cur, days } }
    })
  }, [])

  const applyRepeat = useCallback(
    async (slot: TimeSlot) => {
      const pref = getRepeat(slot.id)
      if (!pref.enabled || pref.days.length === 0 || !onApplyTimeBlockToWeek) return
      const r = await onApplyTimeBlockToWeek(
        {
          time: slot.time,
          category: slot.category,
          activity: slot.activity,
          colorClass: slot.colorClass,
        },
        pref.days,
      )
      if (!r.error) flashSaved()
    },
    [getRepeat, onApplyTimeBlockToWeek, flashSaved],
  )

  return (
    <Card className={cn('p-4 relative', className)}>
      {savedVisible ? (
        <span
          className="absolute top-3 right-3 text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          Saved ✓
        </span>
      ) : null}

      <div className="mb-3 flex flex-col gap-2 pr-16 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {!hideScheduleTitle ? (
            <>
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <span className="label-machine text-foreground">Time schedule</span>
            </>
          ) : null}
          {headerActions ? (
            <span className="flex flex-wrap items-center gap-1.5">{headerActions}</span>
          ) : null}
        </div>
        {showPlannerLink ? (
          <Link
            href="/planner"
            className="inline-flex min-h-[44px] shrink-0 items-center text-xs font-medium text-accent hover:underline md:min-h-0"
          >
            Weekly habit grid →
          </Link>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <span className="label-machine shrink-0">Time increments</span>
        <div className="flex flex-wrap gap-1.5">
          {INCREMENT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={increment === opt.value ? 'secondary' : 'outline'}
              className="text-xs"
              onClick={() => setIncrementAndStore(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {timeSlots.map((slot) => {
          const coerced = coerceTimeValue(slot.time, timeOptions)
          const repeat = getRepeat(slot.id)
          const rowKey = `${selectedDateKey ?? 'local'}-${slot.time}-${slot.id}`
          return (
            <TimeScheduleSlotRow
              key={rowKey}
              slot={slot}
              coerced={coerced}
              timeOptions={timeOptions}
              repeat={repeat}
              updateSlot={updateSlot}
              deleteSlot={deleteSlot}
              onApplyTimeBlockToWeek={onApplyTimeBlockToWeek}
              setRepeatEnabled={setRepeatEnabled}
              toggleRepeatDay={toggleRepeatDay}
              applyRepeat={applyRepeat}
            />
          )
        })}
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5 md:h-8 md:w-auto"
          onClick={() => {
            if (addDisabled) {
              onAddDisabledClick?.()
              return
            }
            addEmptyRow()
          }}
          disabled={addDisabled}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add time block
        </Button>
      </div>
    </Card>
  )
}
