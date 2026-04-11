'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  format,
  startOfWeek,
} from 'date-fns'
import type { MonkData } from '@/lib/monk-types'
import type { DataServiceContext } from '@/lib/dataService'
import { setHabitCompletion } from '@/lib/dataService'

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

type Props = {
  data: MonkData
  onChange: (next: MonkData) => void
  dataContext: DataServiceContext
  /** When false (Free tier), only today’s column is shown and week navigation is disabled. */
  allowFullWeek: boolean
}

export function WeeklyPlannerApp({
  data,
  onChange,
  dataContext,
  allowFullWeek,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const monday = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    return addWeeks(base, weekOffset)
  }, [weekOffset])

  const weekDays = eachDayOfInterval({
    start: monday,
    end: addDays(monday, 6),
  })

  const today = new Date()
  const todayKey = format(today, 'yyyy-MM-dd')
  const todayLabel = format(today, 'EEE d')

  const { dayKeys, dayLabels } = useMemo(() => {
    if (allowFullWeek) {
      return {
        dayKeys: weekDays.map((d) => format(d, 'yyyy-MM-dd')),
        dayLabels: weekDays.map((d) => format(d, 'EEE d')),
      }
    }
    return {
      dayKeys: [todayKey],
      dayLabels: [todayLabel],
    }
  }, [allowFullWeek, weekDays, todayKey, todayLabel])

  const toggle = (habitId: string, dateKey: string) => {
    const prev = data.habitLog[habitId]?.[dateKey] ?? false
    const nextDone = !prev
    const habitLog = {
      ...data.habitLog,
      [habitId]: { ...data.habitLog[habitId], [dateKey]: nextDone },
    }
    onChange({ ...data, habitLog })
    void setHabitCompletion(dataContext, habitId, dateKey, nextDone, habitLog)
  }

  const navDisabled = !allowFullWeek
  const weekTooltip = 'Upgrade to Pro to plan your full week.'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Weekly habit planner</h1>
          <p className="text-sm text-muted-foreground">
            {allowFullWeek
              ? `Week of ${format(monday, 'MMM d')} — tap cells to log habits`
              : `Today (${todayLabel}) — Free plan shows today only`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
          {navDisabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border opacity-50 cursor-not-allowed md:h-9 md:w-9"
                    disabled
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{weekTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border hover:bg-secondary md:h-9 md:w-9"
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {navDisabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-border px-3 text-sm opacity-50 cursor-not-allowed md:min-h-0 md:py-1.5"
                    disabled
                  >
                    This week
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{weekTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border px-3 text-sm hover:bg-secondary md:min-h-0 md:py-1.5"
              onClick={() => setWeekOffset(0)}
            >
              This week
            </button>
          )}
          {navDisabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border opacity-50 cursor-not-allowed md:h-9 md:w-9"
                    disabled
                    aria-label="Next week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{weekTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border hover:bg-secondary md:h-9 md:w-9"
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
        {data.habits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No habits to show.{' '}
            <Link href="/habits" className="text-accent font-medium hover:underline">
              Add habits first
            </Link>
            .
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground">
                  Habit
                </th>
                {dayLabels.map((label, i) => (
                  <th
                    key={dayKeys[i]}
                    className="text-center py-3 px-1 font-medium text-muted-foreground w-14"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.habits.map((habit) => (
                <tr key={habit.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium">{habit.name}</td>
                  {dayKeys.map((dk) => (
                    <td key={dk} className="text-center py-2">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={!!data.habitLog[habit.id]?.[dk]}
                          onCheckedChange={() => toggle(habit.id, dk)}
                          className={checkClass}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
