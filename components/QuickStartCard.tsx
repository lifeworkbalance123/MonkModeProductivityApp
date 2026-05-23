'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProgramType } from '@/lib/programStatus'
import {
  readQuickStartState,
  writeQuickStartState,
  type QuickStartPersisted,
  type QuickStartTrackId,
} from '@/lib/onboardingState'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export type QuickStartTask = {
  id: string
  label: string
  href: string
}

/** Productivity app only — no active `user_programs` row. */
export const QUICK_START_TRACK_1: QuickStartTask[] = [
  {
    id: 'exploreDashboard',
    label: 'Explore the Dashboard',
    href: '/dashboard',
  },
  {
    id: 'addHabit',
    label: 'Add at least 2 habits',
    href: '/habits',
  },
  { id: 'setGoal', label: 'Set a goal', href: '/goals' },
  {
    id: 'scheduleBlock',
    label: 'Schedule your first time block',
    href: '/schedule',
  },
  {
    id: 'focusTimer25',
    label: 'Try the Focus timer for 25 minutes',
    href: '/focus',
  },
  {
    id: 'watchVideo',
    label: 'Watch a video in the Library',
    href: '/videos',
  },
]

/** Enrolled — active program track. */
export const QUICK_START_TRACK_2: QuickStartTask[] = [
  {
    id: 'chooseProgram',
    label: 'Choose a program (Sprint, Monk Mode, Transform)',
    href: '/join',
  },
  {
    id: 'completeOnboarding',
    label: 'Complete onboarding questions',
    href: '/onboarding',
  },
  {
    id: 'addHabit',
    label: 'Add at least 2 habits',
    href: '/habits',
  },
  {
    id: 'setGoal',
    label: 'Set a goal for your program duration',
    href: '/goals',
  },
  {
    id: 'scheduleBlock',
    label: 'Schedule one time block for deep work',
    href: '/schedule',
  },
  {
    id: 'beginLesson',
    label: 'Click Begin and finish Day 1 lesson',
    href: '/today',
  },
]

type Props = {
  userId: string
  /** Supabase user.created_at ISO string */
  userCreatedAt?: string | null
  /** Client program summary (used with API for Track 2 auto-checks). */
  programType: ProgramType | null
  currentProgramDay: number | null
  habitsCount: number
  goalsCount: number
  timeSlotsCount: number
}

function isAccountWithinDays(createdAt: string | null | undefined, days: number) {
  if (!createdAt) return false
  try {
    const created = parseISO(createdAt)
    return differenceInCalendarDays(new Date(), created) <= days
  } catch {
    return false
  }
}

function tasksForTrack(track: QuickStartTrackId): QuickStartTask[] {
  return track === '2' ? QUICK_START_TRACK_2 : QUICK_START_TRACK_1
}

type DeriveArgs = {
  track: QuickStartTrackId
  hasActiveProgram: boolean
  programType: ProgramType | null
  currentProgramDay: number | null
  habitsCount: number
  goalsCount: number
  timeSlotsCount: number
}

function derivedCompletedIds(a: DeriveArgs): Set<string> {
  const s = new Set<string>()
  if (a.track === '1') {
    if (a.habitsCount >= 2) s.add('addHabit')
    if (a.goalsCount >= 1) s.add('setGoal')
    if (a.timeSlotsCount >= 1) s.add('scheduleBlock')
    return s
  }
  const enrolled = a.hasActiveProgram || !!a.programType
  if (enrolled) {
    s.add('chooseProgram')
  }
  if (
    enrolled &&
    (a.habitsCount >= 1 || a.goalsCount >= 1 || a.timeSlotsCount >= 1)
  ) {
    s.add('completeOnboarding')
  }
  if (a.habitsCount >= 2) s.add('addHabit')
  if (a.goalsCount >= 1) s.add('setGoal')
  if (a.timeSlotsCount >= 1) s.add('scheduleBlock')
  if (a.currentProgramDay != null && a.currentProgramDay >= 2) {
    s.add('beginLesson')
  }
  return s
}

function mergeCompleted(
  derived: Set<string>,
  manual: string[],
  allIds: string[],
): Set<string> {
  const out = new Set(derived)
  for (const id of manual) {
    if (allIds.includes(id)) out.add(id)
  }
  return out
}

export function QuickStartCard(props: Props) {
  const { userId, userCreatedAt, programType } = props
  const [programLoading, setProgramLoading] = useState(true)
  const [hasActiveProgram, setHasActiveProgram] = useState(false)
  const [persisted, setPersisted] = useState<QuickStartPersisted>({
    dismissed: false,
    startedAt: null,
    manual: [],
  })
  const [hydrated, setHydrated] = useState(false)

  const track: QuickStartTrackId = hasActiveProgram ? '2' : '1'
  const tasks = useMemo(() => tasksForTrack(track), [track])

  useEffect(() => {
    let cancelled = false
    setProgramLoading(true)
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          if (!cancelled) setHasActiveProgram(false)
          return
        }
        const res = await fetch('/api/user/program', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = (await res.json().catch(() => ({}))) as {
          hasActiveProgram?: boolean
        }
        if (!cancelled) setHasActiveProgram(json.hasActiveProgram === true)
      } catch {
        if (!cancelled) setHasActiveProgram(false)
      } finally {
        if (!cancelled) setProgramLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (programLoading || !userId) return
    const t: QuickStartTrackId = hasActiveProgram ? '2' : '1'
    setPersisted(readQuickStartState(userId, t))
    setHydrated(true)
  }, [userId, programLoading, hasActiveProgram])

  const eligibleSurface =
    !hasActiveProgram || isAccountWithinDays(userCreatedAt, 7)

  const startedAt = persisted.startedAt
  const expiredByWeek = useMemo(() => {
    if (!startedAt) return false
    try {
      const start = parseISO(startedAt)
      return differenceInCalendarDays(new Date(), start) > 7
    } catch {
      return false
    }
  }, [startedAt])

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  const derived = useMemo(
    () =>
      derivedCompletedIds({
        track,
        hasActiveProgram,
        programType,
        currentProgramDay: props.currentProgramDay,
        habitsCount: props.habitsCount,
        goalsCount: props.goalsCount,
        timeSlotsCount: props.timeSlotsCount,
      }),
    [
      track,
      hasActiveProgram,
      programType,
      props.currentProgramDay,
      props.habitsCount,
      props.goalsCount,
      props.timeSlotsCount,
    ],
  )

  const completed = useMemo(
    () => mergeCompleted(derived, persisted.manual, taskIds),
    [derived, persisted.manual, taskIds],
  )

  const allDone = useMemo(
    () => taskIds.every((id) => completed.has(id)),
    [taskIds, completed],
  )

  const persist = useCallback(
    (next: QuickStartPersisted) => {
      setPersisted(next)
      writeQuickStartState(userId, track, next)
    },
    [userId, track],
  )

  useEffect(() => {
    if (!hydrated || persisted.dismissed || expiredByWeek || allDone) return
    if (!persisted.startedAt) {
      persist({
        ...persisted,
        startedAt: new Date().toISOString(),
      })
    }
  }, [hydrated, persisted, expiredByWeek, allDone, persist])

  const dismiss = useCallback(() => {
    persist({ ...persisted, dismissed: true })
  }, [persist, persisted])

  const toggleManual = useCallback(
    (id: string) => {
      const hasDerived = derived.has(id)
      if (hasDerived) return
      const nextManual = persisted.manual.includes(id)
        ? persisted.manual.filter((x) => x !== id)
        : [...persisted.manual, id]
      persist({ ...persisted, manual: nextManual })
    },
    [derived, persist, persisted],
  )

  if (!userId) return null
  if (programLoading) {
    return (
      <Card className="mb-6 border-border/80 bg-card shadow-sm" aria-busy="true">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-16" />
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-3 w-full max-w-md" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-[1.15rem] shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hydrated) return null
  if (!eligibleSurface) return null
  if (persisted.dismissed || expiredByWeek || allDone) return null

  const title =
    track === '2' ? 'Your first day checklist — program' : 'Your first day checklist — productivity'

  return (
    <Card className="mb-6 border-border/80 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-base font-semibold leading-snug text-foreground">
          {title}
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={dismiss}
        >
          Dismiss
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <p className="text-xs text-muted-foreground">
          {track === '2'
            ? 'Program track: tick items as you go — we also check them off when the app sees progress. Hidden after 7 days, when everything is done, or if you dismiss.'
            : 'Productivity track: tick items as you go — we auto-check habits, goals, and schedule when data is saved. Hidden after 7 days, when everything is done, or if you dismiss.'}
        </p>
        <ul className="space-y-2">
          {tasks.map((task) => {
            const done = completed.has(task.id)
            const lockedByData = derived.has(task.id)
            return (
              <li key={task.id} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleManual(task.id)}
                  className={cn(
                    'mt-0.5 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    lockedByData && 'cursor-default opacity-90',
                  )}
                  aria-pressed={done}
                  aria-label={done ? `${task.label} — done` : `${task.label} — not done`}
                >
                  {done ? (
                    <CheckCircle2 className="size-[1.15rem] text-accent" aria-hidden />
                  ) : (
                    <Circle className="size-[1.15rem] text-muted-foreground" aria-hidden />
                  )}
                </button>
                <Link
                  href={task.href}
                  className="min-w-0 flex-1 text-left text-sm text-foreground underline-offset-4 hover:underline"
                >
                  {task.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
