'use client'

import { useMemo, useState } from 'react'
import {
  addDays,
  format,
  getMonth,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { cn } from '@/lib/utils'

export type HeatmapCell = {
  date: string
  percentage: number
  completed: number
  total: number
}

function cellBg(p: number, isFuture: boolean): string {
  if (isFuture || p < 0) return '#1F2937'
  if (p === 0) return '#1F2937'
  if (p <= 25) return '#78350F'
  if (p <= 50) return '#B45309'
  if (p <= 75) return '#D97706'
  if (p < 100) return '#F59E0B'
  return '#FCD34D'
}

const ROW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

type Props = {
  cells: HeatmapCell[]
  mostName: string
  mostPct: number
  leastName: string
  leastPct: number
}

export function HabitHeatmap({
  cells,
  mostName,
  mostPct,
  leastName,
  leastPct,
}: Props) {
  const [tip, setTip] = useState<{
    x: number
    y: number
    label: string
  } | null>(null)

  const anchorMonday = useMemo(() => {
    const today = startOfDay(new Date())
    return startOfWeek(subWeeks(today, 51), { weekStartsOn: 1 })
  }, [])

  return (
    <div className="relative overflow-x-auto pb-1">
      {tip ? (
        <div
          className="pointer-events-none fixed z-[100] rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          {tip.label}
        </div>
      ) : null}

      <div className="min-w-[640px]">
        <div className="mb-1 flex pl-8 text-[10px] text-muted-foreground">
          {Array.from({ length: 52 }, (_, col) => {
            const d = addDays(anchorMonday, col * 7)
            const prev = col > 0 ? addDays(anchorMonday, (col - 1) * 7) : null
            const show =
              col === 0 || (prev != null && getMonth(d) !== getMonth(prev))
            return (
              <div
                key={col}
                className="w-[14px] shrink-0 overflow-hidden text-center leading-none"
              >
                {show ? format(d, 'MMM') : ''}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          <div className="flex w-7 shrink-0 flex-col justify-around py-0.5 text-center text-[10px] text-muted-foreground">
            {ROW_LABELS.map((l, i) => (
              <div key={`${l}-${i}`} className="h-3 leading-3">
                {l}
              </div>
            ))}
          </div>

          <div
            className="grid flex-1"
            style={{
              gridTemplateColumns: `repeat(52, 12px)`,
              gridTemplateRows: `repeat(7, 12px)`,
              gap: 2,
            }}
          >
            {cells.map((cell, idx) => {
              const col = Math.floor(idx / 7)
              const row = idx % 7
              const isFuture = cell.percentage < 0
              const d = parseISO(cell.date)
              const label = `${format(d, 'EEE d MMM')} — ${cell.completed}/${cell.total || '—'} habits (${isFuture ? '—' : `${cell.percentage}%`})`
              return (
                <div
                  key={cell.date}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'rounded-[2px] transition-transform hover:scale-110 hover:ring-1 hover:ring-amber-400/50 focus:outline-none',
                  )}
                  style={{
                    gridColumn: col + 1,
                    gridRow: row + 1,
                    width: 12,
                    height: 12,
                    backgroundColor: cellBg(cell.percentage, isFuture),
                  }}
                  onMouseEnter={(e) =>
                    setTip({
                      x: e.clientX,
                      y: e.clientY,
                      label,
                    })
                  }
                  onMouseMove={(e) =>
                    setTip((t) =>
                      t ? { ...t, x: e.clientX, y: e.clientY } : null,
                    )
                  }
                  onMouseLeave={() => setTip(null)}
                  onFocus={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    setTip({
                      x: r.left,
                      y: r.top,
                      label,
                    })
                  }}
                  onBlur={() => setTip(null)}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="text-foreground">Most consistent:</span>{' '}
          {mostName} ({mostPct}% completion)
        </p>
        <p>
          <span className="text-foreground">Needs work:</span> {leastName} (
          {leastPct}% completion)
        </p>
      </div>
    </div>
  )
}
