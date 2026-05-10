'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Timer } from 'lucide-react'
import { Confetti } from '@/components/ui/Confetti'
import { SessionSummary } from '@/components/focus/SessionSummary'
import {
  POMODORO_PRESETS,
  presetIdFromTotals,
  type PomodoroPresetId,
} from '@/components/focus/TimerPresets'
import {
  clearPomodoro,
  loadPomodoro,
  savePomodoro,
} from '@/lib/focus-timer-storage'
import { format } from 'date-fns'
import { appendFocusIntentToDailyLog } from '@/lib/focus-intent-daily-log'
import {
  firePomodoroSessionConfetti,
  POMODORO_LONG_WORK_SEC,
} from '@/lib/pomodoro-canvas-confetti'
import { loadFocusLocalStats, recordPomodoroWorkCompletion } from '@/lib/focus-gamification'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { CircularProgressRing } from '@/components/ui/circular-progress-ring'
import { isEditableOrTypingTarget } from '@/lib/keyboard-shortcut-guards'
import { playFocusEndChime } from '@/lib/focus-end-chime'
import { getUserIdSafe } from '@/lib/supabaseAuthSafe'
import {
  playFocusTransitionCue,
  playSoftTimerTick,
  pulseTimerVibration,
  showTimerNotification,
} from '@/lib/timer-alarm'
import { useFaviconTimer } from '@/hooks/useFaviconTimer'
import { useLoopingFocusTrack, type LoopingFocusTrack } from '@/hooks/useLoopingFocusTrack'
import {
  fetchDeepWorkCmsPublic,
  filterLoadedActiveTracks,
  type DeepWorkCmsState,
} from '@/lib/deep-work-site-settings'

const DEFAULT_WORK = 25 * 60
const DEFAULT_BREAK = 5 * 60

type Props = {
  alarmSoundRef: RefObject<boolean>
  alarmNotifyRef: RefObject<boolean>
}

export function PomodoroTimerCard({ alarmSoundRef, alarmNotifyRef }: Props) {
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle')
  const [secLeft, setSecLeft] = useState(DEFAULT_WORK)
  const wallEnd = useRef<number | null>(null)
  const pausedRemainder = useRef(0)
  const statusRef = useRef(status)

  const [workTotalSec, setWorkTotalSec] = useState(DEFAULT_WORK)
  const [breakTotalSec, setBreakTotalSec] = useState(DEFAULT_BREAK)
  const workTotalRef = useRef(workTotalSec)
  const breakTotalRef = useRef(breakTotalSec)
  useEffect(() => {
    workTotalRef.current = workTotalSec
  }, [workTotalSec])
  useEffect(() => {
    breakTotalRef.current = breakTotalSec
  }, [breakTotalSec])

  const [presetId, setPresetId] = useState<PomodoroPresetId | null>('p25')
  const [intent, setIntent] = useState('')
  const [intentLocked, setIntentLocked] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [confettiTick, setConfettiTick] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState<LoopingFocusTrack>(null)
  const [deepWorkCms, setDeepWorkCms] = useState<DeepWorkCmsState | null>(null)

  const lastTickSec = useRef<number | null>(null)

  const loadedMp3Tracks = useMemo(
    () => (deepWorkCms ? filterLoadedActiveTracks(deepWorkCms) : []),
    [deepWorkCms],
  )

  useLoopingFocusTrack(selectedTrack, status === 'running' && mode === 'work')

  useFaviconTimer(secLeft, status === 'running' || status === 'paused')

  useEffect(() => {
    setSessionsToday(loadFocusLocalStats().pomodoroWorkCompletions)
  }, [])

  useEffect(() => {
    void fetchDeepWorkCmsPublic(supabase).then(setDeepWorkCms)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const userId = await getUserIdSafe()
      if (!userId || cancelled) return
      const logDate = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('daily_logs')
        .select('micro_journal_text')
        .eq('user_id', userId)
        .eq('log_date', logDate)
        .maybeSingle()
      if (cancelled || error) return
      const text = data?.micro_journal_text
      if (typeof text === 'string' && text.trim()) {
        setIntent(text.trim().slice(0, 280))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const total = mode === 'work' ? workTotalSec : breakTotalSec

  const sync = useCallback(() => {
    if (wallEnd.current == null) return
    const s = Math.max(0, Math.ceil((wallEnd.current - Date.now()) / 1000))
    setSecLeft(s)
    if (s === 0) {
      wallEnd.current = null
      const ended = modeRef.current
      const nextMode = ended === 'work' ? 'break' : 'work'
      modeRef.current = nextMode
      if (alarmSoundRef.current) {
        playFocusEndChime(
          true,
          ended === 'work' ? 'pomodoro-work' : 'pomodoro-break',
        )
      }
      if (alarmNotifyRef.current) {
        if (ended === 'work') {
          showTimerNotification('Pomodoro — focus complete', 'Time for a short break.')
        } else {
          showTimerNotification('Pomodoro — break over', 'Start your next focus round when you are ready.')
        }
      }
      pulseTimerVibration()
      if (ended === 'work') {
        const stats = recordPomodoroWorkCompletion()
        const completedWorkSec = workTotalRef.current
        queueMicrotask(() => {
          setSessionsToday(stats.pomodoroWorkCompletions)
          setShowSummary(true)
          if (completedWorkSec === POMODORO_LONG_WORK_SEC) {
            firePomodoroSessionConfetti()
          } else {
            setConfettiTick((t) => t + 1)
          }
        })
      }
      if (ended === 'break') {
        queueMicrotask(() => setIntentLocked(false))
      }
      setMode(nextMode)
      setStatus('idle')
      savePomodoro({
        v: 1,
        mode: nextMode,
        status: 'idle',
        wallEndMs: null,
        pausedSec: 0,
        workTotalSec: workTotalRef.current,
        breakTotalSec: breakTotalRef.current,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alarm refs are stable RefObjects
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(sync, 250)
    const onVis = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVis)
    sync()
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [status, sync])

  useEffect(() => {
    if (status !== 'running' || mode !== 'work') {
      lastTickSec.current = null
      return
    }
    if (secLeft > 10 || secLeft < 1) {
      lastTickSec.current = null
      return
    }
    if (!alarmSoundRef.current) return
    if (lastTickSec.current === secLeft) return
    lastTickSec.current = secLeft
    playSoftTimerTick(secLeft)
  }, [secLeft, status, mode, alarmSoundRef])

  const flushPomodoro = useCallback(() => {
    savePomodoro({
      v: 1,
      mode: modeRef.current,
      status: statusRef.current,
      wallEndMs: wallEnd.current,
      pausedSec: pausedRemainder.current,
      workTotalSec: workTotalRef.current,
      breakTotalSec: breakTotalRef.current,
    })
  }, [])

  useLayoutEffect(() => {
    const s = loadPomodoro()
    if (!s) return
    const now = Date.now()
    const w = s.workTotalSec && s.workTotalSec >= 60 ? s.workTotalSec : DEFAULT_WORK
    const b = s.breakTotalSec && s.breakTotalSec >= 60 ? s.breakTotalSec : DEFAULT_BREAK
    setWorkTotalSec(w)
    setBreakTotalSec(b)
    setPresetId(presetIdFromTotals(w, b))

    if (s.status === 'paused') {
      modeRef.current = s.mode
      setMode(s.mode)
      wallEnd.current = null
      pausedRemainder.current = s.pausedSec
      setSecLeft(s.pausedSec)
      setStatus('paused')
      setIntentLocked(true)
      return
    }

    if (s.status === 'idle') {
      modeRef.current = s.mode
      setMode(s.mode)
      setSecLeft(s.mode === 'work' ? w : b)
      setStatus('idle')
      return
    }

    if (s.status === 'running' && s.wallEndMs != null) {
      if (s.wallEndMs > now) {
        modeRef.current = s.mode
        setMode(s.mode)
        wallEnd.current = s.wallEndMs
        setSecLeft(Math.ceil((s.wallEndMs - now) / 1000))
        setStatus('running')
        setIntentLocked(true)
        return
      }
      wallEnd.current = null
      const ended = s.mode
      const nextMode = ended === 'work' ? 'break' : 'work'
      modeRef.current = nextMode
      if (alarmSoundRef.current) {
        playFocusEndChime(
          true,
          ended === 'work' ? 'pomodoro-work' : 'pomodoro-break',
        )
      }
      if (alarmNotifyRef.current) {
        if (ended === 'work') {
          showTimerNotification('Pomodoro — focus complete', 'Time for a short break.')
        } else {
          showTimerNotification('Pomodoro — break over', 'Start your next focus round when you are ready.')
        }
      }
      pulseTimerVibration()
      if (ended === 'work') {
        const stats = recordPomodoroWorkCompletion()
        setSessionsToday(stats.pomodoroWorkCompletions)
        setShowSummary(true)
        if (w === POMODORO_LONG_WORK_SEC) {
          firePomodoroSessionConfetti()
        } else {
          setConfettiTick((t) => t + 1)
        }
      }
      if (ended === 'break') {
        setIntentLocked(false)
      }
      setMode(nextMode)
      setStatus('idle')
      savePomodoro({
        v: 1,
        mode: nextMode,
        status: 'idle',
        wallEndMs: null,
        pausedSec: 0,
        workTotalSec: w,
        breakTotalSec: b,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once; alarm refs stable
  }, [])

  useEffect(() => {
    if (status === 'idle') {
      setSecLeft(total)
    }
  }, [mode, total, status])

  useEffect(() => {
    if (status === 'running') {
      flushPomodoro()
      const id = window.setInterval(flushPomodoro, 2000)
      const onHide = () => flushPomodoro()
      window.addEventListener('pagehide', onHide)
      return () => {
        window.clearInterval(id)
        window.removeEventListener('pagehide', onHide)
      }
    }
    if (status === 'paused') {
      flushPomodoro()
    }
  }, [status, flushPomodoro])

  function applyPreset(p: (typeof POMODORO_PRESETS)[number]) {
    if (status !== 'idle') return
    setPresetId(p.id)
    setWorkTotalSec(p.workMin * 60)
    setBreakTotalSec(p.breakMin * 60)
    setSecLeft(mode === 'work' ? p.workMin * 60 : p.breakMin * 60)
  }

  function setDuration(workSeconds: number) {
    const p = POMODORO_PRESETS.find((x) => x.workMin * 60 === workSeconds)
    if (!p) return
    applyPreset(p)
  }

  function start() {
    const line = intent.trim()
    if (!line || line.length < 3) return
    setIntentLocked(true)
    if (alarmSoundRef.current) {
      playFocusTransitionCue('start')
    }
    void appendFocusIntentToDailyLog(supabase, line)
    wallEnd.current = Date.now() + secLeft * 1000
    setStatus('running')
  }

  function pause() {
    if (statusRef.current !== 'running' || wallEnd.current == null) return
    if (alarmSoundRef.current) {
      playFocusTransitionCue('pause')
    }
    pausedRemainder.current = Math.max(
      0,
      Math.ceil((wallEnd.current - Date.now()) / 1000),
    )
    wallEnd.current = null
    setSecLeft(pausedRemainder.current)
    setStatus('paused')
  }

  function resume() {
    if (statusRef.current !== 'paused') return
    const s = pausedRemainder.current
    if (s <= 0) return
    if (alarmSoundRef.current) {
      playFocusTransitionCue('start')
    }
    wallEnd.current = Date.now() + s * 1000
    setStatus('running')
  }

  function reset() {
    wallEnd.current = null
    setStatus('idle')
    setSecLeft(mode === 'work' ? workTotalSec : breakTotalSec)
    setIntentLocked(false)
    clearPomodoro()
  }

  const mm = String(Math.floor(secLeft / 60)).padStart(2, '0')
  const ss = String(secLeft % 60).padStart(2, '0')
  const workMinutes = Math.round(workTotalSec / 60)
  const intentValid = intent.trim().length >= 3

  const actionsRef = useRef({ start, pause, resume, reset })
  actionsRef.current = { start, pause, resume, reset }
  const intentValidRef = useRef(intentValid)
  intentValidRef.current = intentValid
  const showSummaryRef = useRef(showSummary)
  showSummaryRef.current = showSummary

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (isEditableOrTypingTarget(e)) return

      if (e.code === 'Escape') {
        if (showSummaryRef.current) {
          e.preventDefault()
          setShowSummary(false)
        }
        return
      }

      if (e.code === 'Space') {
        const st = statusRef.current
        if (st === 'running') {
          e.preventDefault()
          actionsRef.current.pause()
        } else if (st === 'paused') {
          e.preventDefault()
          actionsRef.current.resume()
        } else if (st === 'idle' && intentValidRef.current) {
          e.preventDefault()
          actionsRef.current.start()
        }
        return
      }

      if (e.code === 'KeyR') {
        e.preventDefault()
        actionsRef.current.reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Card
      id="pomodoro-focus"
      className="scroll-mt-24 rounded-2xl border-2 border-border bg-card p-6 shadow-none md:scroll-mt-28"
    >
      <Confetti trigger={confettiTick} />
      <SessionSummary
        open={showSummary}
        onOpenChange={setShowSummary}
        workMinutes={workMinutes}
        sessionsToday={sessionsToday}
      />
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Timer className="h-5 w-5 text-primary" />
        <div className="label-machine text-foreground">Round timer</div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Pomodoro</h2>
        <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {mode === 'work' ? 'Focus' : 'Break'}
        </span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick a session length, set intent (at least 3 characters; prefilled from today&apos;s log
        when present), then start. It is saved to your daily log and locked for this focus round.
        Timer alerts are configured above.
      </p>

      <div className="mb-4">
        <p className="label-machine mb-2">Session length</p>
        <div className="preset-buttons flex flex-wrap gap-2">
          <button
            type="button"
            disabled={status !== 'idle'}
            onClick={() => setDuration(25 * 60)}
            className={cn(
              'rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors',
              status !== 'idle' && 'cursor-not-allowed opacity-50',
              presetId === 'p25'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
            )}
          >
            25 min
          </button>
          <button
            type="button"
            disabled={status !== 'idle'}
            onClick={() => setDuration(50 * 60)}
            className={cn(
              'rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors',
              status !== 'idle' && 'cursor-not-allowed opacity-50',
              presetId === 'p50'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
            )}
          >
            50 min
          </button>
          <button
            type="button"
            disabled={status !== 'idle'}
            onClick={() => setDuration(90 * 60)}
            className={cn(
              'rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors',
              status !== 'idle' && 'cursor-not-allowed opacity-50',
              presetId === 'p90'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
            )}
          >
            90 min
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <p className="label-machine">Background audio (optional)</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={status !== 'idle'}
            onClick={() => setSelectedTrack(null)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              status !== 'idle' && 'cursor-not-allowed opacity-50',
              selectedTrack == null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
            )}
          >
            None
          </button>
          {loadedMp3Tracks.map((t) => {
            const u = t.url?.trim()
            if (!u) return null
            const active = selectedTrack?.url === u
            return (
              <button
                key={t.key}
                type="button"
                disabled={status !== 'idle'}
                title={t.label}
                onClick={() => setSelectedTrack({ url: u, label: t.label })}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  status !== 'idle' && 'cursor-not-allowed opacity-50',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        {loadedMp3Tracks.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Curated tracks from admin appear here (same library as Deep Work). None is fine.
          </p>
        ) : null}
      </div>

      <div className="mb-4 space-y-2">
        <Label htmlFor="focus-pomodoro-intent" className="text-xs text-muted-foreground">
          Pre-focus intent (required)
        </Label>
        <Textarea
          id="focus-pomodoro-intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="What will you ship in this block?"
          rows={2}
          maxLength={280}
          disabled={intentLocked || status === 'running' || status === 'paused'}
          className="resize-none bg-background text-sm"
        />
        {status === 'idle' && !intentValid ? (
          <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
            Add at least 3 characters to describe your intent before starting.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          <CircularProgressRing remaining={secLeft} total={total} size={240} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p
              className={cn(
                'timer-digit !text-[clamp(2.5rem,12vw,4rem)]',
                status === 'running' && 'running',
                status === 'paused' && 'paused',
                status === 'running' &&
                  mode === 'work' &&
                  secLeft <= 10 &&
                  secLeft >= 1 &&
                  'urgent',
              )}
            >
              {mm}:{ss}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {status === 'idle' ? (
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!intentValid}
              onClick={start}
            >
              Start
            </Button>
          ) : null}
          {status === 'running' ? (
            <Button type="button" variant="outline" onClick={pause}>
              Pause
            </Button>
          ) : null}
          {status === 'paused' ? (
            <Button type="button" onClick={resume}>
              Resume
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>
    </Card>
  )
}
