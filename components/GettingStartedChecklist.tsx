'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { filterGoalsWithNonEmptyText } from '@/lib/goals-utils'
import type { MonkData } from '@/lib/monk-types'
import { useToast } from '@/context/ToastContext'

const STORAGE_KEY = 'onboarding_checklist'

type ChecklistState = {
  celebrated?: boolean
}

function readState(): ChecklistState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChecklistState) : {}
  } catch {
    return {}
  }
}

function writeState(next: ChecklistState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function GettingStartedChecklist({
  data,
  morningGratitudeFields,
}: {
  data: MonkData
  /** When set (e.g. calendar-today snapshot from dashboard), use for gratitude check. */
  morningGratitudeFields?: string[]
}) {
  const { showToast } = useToast()
  const [hydrated, setHydrated] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const prevAllDone = useRef(false)

  useEffect(() => {
    const s = readState()
    if (s.celebrated) setDismissed(true)
    setHydrated(true)
  }, [])

  const hasHabit = data.habits.length > 0
  const hasGoal = filterGoalsWithNonEmptyText(data.goals).length > 0
  const hasSlot = data.timeSlots.length > 0
  const gratitudeForCheck = morningGratitudeFields ?? data.gratitude
  const hasGratitude = gratitudeForCheck.some((g) => g.trim().length > 0)

  const allDone = hasHabit && hasGoal && hasSlot && hasGratitude

  useEffect(() => {
    if (!hydrated || dismissed) {
      prevAllDone.current = allDone
      return
    }
    if (allDone && !prevAllDone.current) {
      const s = readState()
      if (!s.celebrated) {
        writeState({ celebrated: true })
        setDismissed(true)
        showToast("You're all set 🔥", 'success')
      } else {
        setDismissed(true)
      }
    }
    prevAllDone.current = allDone
  }, [allDone, dismissed, hydrated, showToast])

  const visible = useMemo(
    () => hydrated && !dismissed && !allDone,
    [hydrated, dismissed, allDone],
  )

  if (!visible) return null

  function CheckIcon({ done }: { done: boolean }) {
    return (
      <span
        aria-hidden
        className={[
          'mt-[1px] inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border',
          done
            ? 'border-accent bg-accent text-accent-foreground'
            : 'border-border bg-background text-muted-foreground',
        ].join(' ')}
      >
        {done ? '✓' : ''}
      </span>
    )
  }

  return (
    <Card className="mb-4 border border-primary/35 bg-card p-4 shadow-none sm:p-5">
      <div className="label-machine">Getting started</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Welcome to monkcubed
        </h2>
        <span className="text-xs font-semibold text-primary">START HERE</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Complete these steps to initialize your system.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center gap-3">
          <CheckIcon done={hasHabit} />
          <Link
            href="/habits"
            className="min-h-11 flex items-center font-semibold text-accent hover:underline md:min-h-0"
          >
            Add your first habit
          </Link>
        </li>
        <li className="flex items-center gap-3">
          <CheckIcon done={hasGoal} />
          <Link
            href="/goals"
            className="min-h-11 flex items-center font-semibold text-accent hover:underline md:min-h-0"
          >
            Set today&apos;s goals
          </Link>
        </li>
        <li className="flex items-center gap-3">
          <CheckIcon done={hasSlot} />
          <Link
            href="/planner"
            className="min-h-11 flex items-center font-semibold text-accent hover:underline md:min-h-0"
          >
            Schedule your first time block
          </Link>
        </li>
        <li className="flex items-center gap-3">
          <CheckIcon done={hasGratitude} />
          <button
            type="button"
            className="min-h-11 flex flex-1 items-center rounded-md py-2 text-left font-semibold text-accent hover:underline md:min-h-0 md:flex-none md:py-0"
            onClick={() => {
              document
                .getElementById('dashboard-morning-gratitude')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Write your morning gratitude
          </button>
        </li>
      </ul>
    </Card>
  )
}
