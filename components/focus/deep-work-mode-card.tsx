'use client'

import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDeepWorkTimer } from '@/hooks/useDeepWorkTimer'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import {
  insertDeepWorkSession,
  listDeepWorkSessions,
  shouldSyncToCloud,
} from '@/lib/dataService'
import {
  appendDeepWorkSessionLocal,
  loadDeepWorkSessionsLocal,
  type DeepWorkSession,
  type DeepWorkSessionResult,
  newDeepWorkSessionId,
} from '@/lib/deep-work-sessions'
import {
  createOceanSound,
  createRainSound,
  createWhiteNoise,
  playChime,
  stopAmbient,
  type AmbientNoiseHandle,
} from '@/lib/deep-work-audio'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProBadge } from '@/components/pro-badge'
import { cn } from '@/lib/utils'
import { Expand, Minimize2, Brain } from 'lucide-react'

const RING_R = 140

type AmbientId = 'silence' | 'rain' | 'ocean' | 'white'

type Props = {
  setSessions: Dispatch<SetStateAction<DeepWorkSession[]>>
}

function formatMmSs(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function RingTimer(props: {
  remaining: number
  total: number
  className?: string
  size?: number
}) {
  const size = props.size ?? 320
  const r = (RING_R / 320) * size
  const c = 2 * Math.PI * r
  const frac = props.total > 0 ? props.remaining / props.total : 0
  const offset = c * (1 - frac)
  const stroke = Math.max(8, (12 / 320) * size)
  const half = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0', props.className)}
    >
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="#1F2937"
        strokeWidth={stroke}
      />
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="#F59E0B"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${half} ${half})`}
      />
    </svg>
  )
}

export function DeepWorkModeCard({ setSessions }: Props) {
  const ctx = useDataServiceContext()
  const { isPro, isLoading: planLoading } = usePlan()
  const chimePlayed = useRef(false)
  const ambientRef = useRef<AmbientNoiseHandle | null>(null)
  const [ambient, setAmbient] = useState<AmbientId>('silence')
  const [immersive, setImmersive] = useState(false)
  const [task, setTask] = useState('')
  const [sprintNumber, setSprintNumber] = useState(1)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [breakModalOpen, setBreakModalOpen] = useState(false)
  const [endEarlyOpen, setEndEarlyOpen] = useState(false)
  const [earlyEndMinutes, setEarlyEndMinutes] = useState(0)

  const onSprintZero = useCallback(() => {
    if (!chimePlayed.current) {
      chimePlayed.current = true
      playChime()
    }
    setCheckInOpen(true)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setImmersive(true)
    }
  }, [])

  const onBreakZero = useCallback(() => {
    setBreakModalOpen(false)
    setSprintNumber((n) => n + 1)
  }, [])

  const timer = useDeepWorkTimer({
    onSprintReachedZero: onSprintZero,
    onBreakReachedZero: onBreakZero,
  })

  const {
    status,
    phase,
    secondsRemaining,
    sprintTotalSeconds,
    breakTotalSeconds,
    startSprint,
    pause,
    resume,
    beginBreak,
    skipBreak,
    getSprintElapsedMinutes,
    endSprintEarly,
  } = timer

  const totalForRing = phase === 'break' ? breakTotalSeconds : sprintTotalSeconds

  const persist = useCallback(
    async (row: DeepWorkSession) => {
      if (shouldSyncToCloud(ctx)) {
        const { error } = await insertDeepWorkSession(ctx, row)
        if (!error) {
          setSessions(await listDeepWorkSessions(ctx))
        } else {
          appendDeepWorkSessionLocal(row)
          setSessions(loadDeepWorkSessionsLocal())
        }
      } else {
        appendDeepWorkSessionLocal(row)
        setSessions(loadDeepWorkSessionsLocal())
      }
    },
    [ctx, setSessions],
  )

  const buildSession = useCallback(
    (partial: {
      task_name: string
      duration_minutes: number
      completed: boolean
      result: DeepWorkSessionResult | null
      sprint_number: number
    }): DeepWorkSession => {
      const id = newDeepWorkSessionId(shouldSyncToCloud(ctx))
      const today = format(new Date(), 'yyyy-MM-dd')
      return {
        id,
        user_id: ctx.userId ?? '',
        date: today,
        task_name: partial.task_name,
        duration_minutes: partial.duration_minutes,
        completed: partial.completed,
        result: partial.result,
        sprint_number: partial.sprint_number,
        created_at: new Date().toISOString(),
      }
    },
    [ctx],
  )

  const stopAllAudio = useCallback(() => {
    stopAmbient(ambientRef.current)
    ambientRef.current = null
  }, [])

  useEffect(() => {
    stopAmbient(ambientRef.current)
    ambientRef.current = null
    if (!immersive || ambient === 'silence') return
    try {
      if (ambient === 'rain') ambientRef.current = createRainSound()
      else if (ambient === 'white') ambientRef.current = createWhiteNoise()
      else if (ambient === 'ocean') ambientRef.current = createOceanSound()
    } catch {
      /* ignore */
    }
    return () => {
      stopAmbient(ambientRef.current)
      ambientRef.current = null
    }
  }, [ambient, immersive])

  useEffect(() => {
    return () => {
      stopAmbient(ambientRef.current)
      ambientRef.current = null
    }
  }, [])

  function handleStart() {
    if (!isPro || planLoading) return
    const t = task.trim()
    if (!t) return
    chimePlayed.current = false
    startSprint()
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setImmersive(true)
    }
  }

  function handleEndSessionClick() {
    if (status === 'completed') return
    if ((status === 'running' || status === 'paused') && phase === 'sprint') {
      setEarlyEndMinutes(getSprintElapsedMinutes())
      setEndEarlyOpen(true)
      return
    }
    if (status === 'break' || (status === 'paused' && phase === 'break')) {
      skipBreak()
      setSprintNumber((n) => n + 1)
      setBreakModalOpen(false)
      stopAllAudio()
      setImmersive(false)
    }
  }

  function confirmEndEarly() {
    const mins = endSprintEarly()
    setEndEarlyOpen(false)
    void persist(
      buildSession({
        task_name: task.trim() || 'Deep work',
        duration_minutes: mins,
        completed: false,
        result: null,
        sprint_number: sprintNumber,
      }),
    )
    stopAllAudio()
    setImmersive(false)
  }

  async function handleCheckIn(result: DeepWorkSessionResult) {
    setCheckInOpen(false)
    chimePlayed.current = false
    try {
      await persist(
        buildSession({
          task_name: task.trim() || 'Deep work',
          duration_minutes: 90,
          completed: true,
          result,
          sprint_number: sprintNumber,
        }),
      )
    } finally {
      beginBreak()
      setBreakModalOpen(true)
    }
  }

  const locked = !planLoading && !isPro

  const centerLabel =
    phase === 'break' || breakModalOpen
      ? 'Break'
      : `Sprint ${sprintNumber}`

  return (
    <>
      <Card
        id="deep-work"
        className="relative scroll-mt-24 overflow-hidden border-border p-6 md:scroll-mt-28"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">Deep Work Mode</h2>
              <span className="rounded-md bg-[#F59E0B]/20 px-2 py-0.5 text-xs font-semibold text-[#F59E0B]">
                PRO
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              90-minute focused sprints. No distractions. Maximum output.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setImmersive(true)}
            disabled={locked}
          >
            <Expand className="h-4 w-4" />
            Enter fullscreen
          </Button>
        </div>

        {status === 'idle' && !breakModalOpen ? (
          <div className="mb-6">
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What will you work on this sprint?"
              disabled={locked}
              className="bg-background/60"
            />
          </div>
        ) : null}

        <div className="relative mx-auto flex max-w-sm flex-col items-center">
          <div className="relative">
            <RingTimer
              remaining={secondsRemaining}
              total={totalForRing}
              size={280}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-4xl font-bold tabular-nums text-white">
                {formatMmSs(secondsRemaining)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{centerLabel}</p>
            </div>
            {locked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-background/70 backdrop-blur-[2px]">
                <ProBadge className="mb-2" />
                <p className="mb-3 text-xs text-muted-foreground">Pro feature</p>
                <Button
                  size="sm"
                  className="bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
                  asChild
                >
                  <Link href="/upgrade">Unlock Deep Work — Upgrade to Pro</Link>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button
              type="button"
              className="bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
              disabled={
                locked ||
                status === 'running' ||
                status === 'break' ||
                status === 'completed' ||
                !task.trim()
              }
              onClick={handleStart}
            >
              Start Deep Work
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                locked ||
                status === 'idle' ||
                status === 'completed' ||
                checkInOpen
              }
              onClick={() => {
                if (status === 'running' || status === 'break') pause()
                else if (status === 'paused') resume()
              }}
            >
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-destructive/60 text-destructive hover:bg-destructive/10"
              disabled={
                locked ||
                (status === 'idle' && !checkInOpen && !breakModalOpen)
              }
              onClick={handleEndSessionClick}
            >
              End Session
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={endEarlyOpen} onOpenChange={setEndEarlyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End session early?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve completed {earlyEndMinutes} minute
              {earlyEndMinutes === 1 ? '' : 's'} of your 90-minute sprint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndEarly}>End session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={checkInOpen} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sprint complete! 🔥</DialogTitle>
            <DialogDescription>How did your session go?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button
              type="button"
              className="justify-start bg-secondary text-left"
              onClick={() => void handleCheckIn('crushed')}
            >
              Crushed it — task complete
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start text-left"
              onClick={() => void handleCheckIn('progress')}
            >
              Good progress — continuing next sprint
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start text-left"
              onClick={() => void handleCheckIn('distracted')}
            >
              Got distracted — try again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={breakModalOpen} onOpenChange={setBreakModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Take a 20-minute break. You earned it.</DialogTitle>
            <DialogDescription>
              Step away from the screen. When you&apos;re ready, start your next
              sprint.
            </DialogDescription>
          </DialogHeader>
          <p className="text-center text-4xl font-bold tabular-nums text-white">
            {formatMmSs(secondsRemaining)}
          </p>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                skipBreak()
                setBreakModalOpen(false)
                setSprintNumber((n) => n + 1)
              }}
            >
              Skip break and start next sprint
            </Button>
            <Button type="button" onClick={() => setBreakModalOpen(false)}>
              Continue break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {immersive ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[#070B14] text-foreground"
          role="dialog"
          aria-label="Deep work fullscreen"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
            aria-label="Exit fullscreen"
            onClick={() => {
              setImmersive(false)
              stopAllAudio()
            }}
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="px-6 pt-16 text-center">
            <p
              className="text-white italic"
              style={{ fontSize: 24, lineHeight: 1.3 }}
            >
              Working on: {task.trim() || '—'}
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="relative">
              <RingTimer
                remaining={secondsRemaining}
                total={totalForRing}
                size={300}
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold tabular-nums text-white md:text-5xl">
                  {formatMmSs(secondsRemaining)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{centerLabel}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 px-6 pb-8">
            <Button
              type="button"
              variant="outline"
              disabled={locked || status === 'completed' || checkInOpen}
              onClick={() => {
                if (status === 'running' || status === 'break') pause()
                else if (status === 'paused') resume()
              }}
            >
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-destructive/60 text-destructive"
              disabled={locked}
              onClick={handleEndSessionClick}
            >
              End Session
            </Button>
          </div>
          <div className="border-t border-white/10 px-6 py-4">
            <p className="mb-3 text-center text-xs text-muted-foreground">
              Ambient sound
            </p>
            <div className="flex justify-center gap-3">
              {(
                [
                  ['silence', '🔇'],
                  ['rain', '🌧️'],
                  ['ocean', '🌊'],
                  ['white', '⬜'],
                ] as const
              ).map(([id, icon]) => (
                <button
                  key={id}
                  type="button"
                  title={id}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg border text-lg transition-colors',
                    ambient === id
                      ? 'border-[#F59E0B] bg-[#F59E0B]/20'
                      : 'border-white/15 bg-white/5 hover:bg-white/10',
                  )}
                  onClick={() => setAmbient(id)}
                >
                  <span aria-hidden>{icon}</span>
                  <span className="sr-only">{id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
