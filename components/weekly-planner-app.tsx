'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  format,
  startOfWeek,
} from 'date-fns'
import type { MonkData } from '@/lib/monk-types'

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

type Props = {
  data: MonkData
  onChange: (next: MonkData) => void
}

export function WeeklyPlannerApp({ data, onChange }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const monday = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    return addWeeks(base, weekOffset)
  }, [weekOffset])

  const days = eachDayOfInterval({
    start: monday,
    end: addDays(monday, 6),
  })

  const dayKeys = days.map((d) => format(d, 'yyyy-MM-dd'))
  const dayLabels = days.map((d) => format(d, 'EEE d'))

  const toggle = (habitId: string, dateKey: string) => {
    const prev = data.habitLog[habitId]?.[dateKey] ?? false
    const habitLog = {
      ...data.habitLog,
      [habitId]: { ...data.habitLog[habitId], [dateKey]: !prev },
    }
    onChange({ ...data, habitLog })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Weekly habit planner</h1>
          <p className="text-sm text-muted-foreground">
            Week of {format(monday, 'MMM d')} — tap cells to log habits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg border border-border hover:bg-secondary"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-secondary"
            onClick={() => setWeekOffset(0)}
          >
            This week
          </button>
          <button
            type="button"
            className="p-2 rounded-lg border border-border hover:bg-secondary"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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
