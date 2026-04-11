'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const DEEP_WORK_SPRINT_SECONDS = 90 * 60
export const DEEP_WORK_BREAK_SECONDS = 20 * 60

export type DeepWorkTimerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'break'
  | 'completed'

export type DeepWorkTimerPhase = 'sprint' | 'break'

type Options = {
  sprintSeconds?: number
  breakSeconds?: number
  onSprintReachedZero?: () => void
  onBreakReachedZero?: () => void
}

export function useDeepWorkTimer(options: Options = {}) {
  const sprintTotal =
    options.sprintSeconds ?? DEEP_WORK_SPRINT_SECONDS
  const breakTotal = options.breakSeconds ?? DEEP_WORK_BREAK_SECONDS

  const onSprintZeroRef = useRef(options.onSprintReachedZero)
  const onBreakZeroRef = useRef(options.onBreakReachedZero)
  useEffect(() => {
    onSprintZeroRef.current = options.onSprintReachedZero
    onBreakZeroRef.current = options.onBreakReachedZero
  }, [options.onSprintReachedZero, options.onBreakReachedZero])

  const [status, setStatus] = useState<DeepWorkTimerStatus>('idle')
  const [secondsRemaining, setSecondsRemaining] = useState(sprintTotal)
  const [phase, setPhase] = useState<DeepWorkTimerPhase>('sprint')

  const wallEndMs = useRef<number | null>(null)
  const phaseRef = useRef<DeepWorkTimerPhase>('sprint')
  const sprintStartedAtMs = useRef<number | null>(null)
  const pausedRemainderSec = useRef(0)
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const syncDisplay = useCallback(() => {
    if (wallEndMs.current == null) return
    const sec = Math.max(
      0,
      Math.ceil((wallEndMs.current - Date.now()) / 1000),
    )
    setSecondsRemaining(sec)
    if (sec === 0) {
      wallEndMs.current = null
      if (phaseRef.current === 'sprint') {
        setStatus('completed')
        onSprintZeroRef.current?.()
      } else {
        setStatus('idle')
        setSecondsRemaining(sprintTotal)
        phaseRef.current = 'sprint'
        setPhase('sprint')
        onBreakZeroRef.current?.()
      }
    }
  }, [sprintTotal])

  useEffect(() => {
    if (status !== 'running' && status !== 'break') return
    const id = window.setInterval(() => {
      syncDisplay()
    }, 250)
    const onVis = () => {
      if (document.visibilityState === 'visible') syncDisplay()
    }
    document.addEventListener('visibilitychange', onVis)
    syncDisplay()
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [status, syncDisplay])

  const startSprint = useCallback(() => {
    phaseRef.current = 'sprint'
    setPhase('sprint')
    sprintStartedAtMs.current = Date.now()
    wallEndMs.current = Date.now() + sprintTotal * 1000
    setSecondsRemaining(sprintTotal)
    setStatus('running')
  }, [sprintTotal])

  const pause = useCallback(() => {
    const s = statusRef.current
    if (s !== 'running' && s !== 'break') return
    if (wallEndMs.current != null) {
      pausedRemainderSec.current = Math.max(
        0,
        Math.ceil((wallEndMs.current - Date.now()) / 1000),
      )
      wallEndMs.current = null
    }
    setSecondsRemaining(pausedRemainderSec.current)
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    const sec = pausedRemainderSec.current
    if (sec <= 0) return
    wallEndMs.current = Date.now() + sec * 1000
    if (phaseRef.current === 'break') {
      setStatus('break')
    } else {
      setStatus('running')
    }
  }, [])

  const beginBreak = useCallback(() => {
    phaseRef.current = 'break'
    setPhase('break')
    sprintStartedAtMs.current = null
    wallEndMs.current = Date.now() + breakTotal * 1000
    setSecondsRemaining(breakTotal)
    setStatus('break')
  }, [breakTotal])

  const skipBreak = useCallback(() => {
    wallEndMs.current = null
    phaseRef.current = 'sprint'
    setPhase('sprint')
    setSecondsRemaining(sprintTotal)
    setStatus('idle')
  }, [sprintTotal])

  const resetToIdle = useCallback(() => {
    wallEndMs.current = null
    sprintStartedAtMs.current = null
    phaseRef.current = 'sprint'
    setPhase('sprint')
    pausedRemainderSec.current = 0
    setSecondsRemaining(sprintTotal)
    setStatus('idle')
  }, [sprintTotal])

  const getSprintElapsedMinutes = useCallback(() => {
    if (sprintStartedAtMs.current != null) {
      const elapsedSec = Math.round(
        (Date.now() - sprintStartedAtMs.current) / 1000,
      )
      return Math.max(1, Math.round(Math.min(elapsedSec, sprintTotal) / 60))
    }
    const used = sprintTotal - secondsRemaining
    return Math.max(1, Math.round(used / 60))
  }, [secondsRemaining, sprintTotal])

  const endSprintEarly = useCallback(() => {
    const mins = getSprintElapsedMinutes()
    wallEndMs.current = null
    sprintStartedAtMs.current = null
    phaseRef.current = 'sprint'
    setPhase('sprint')
    pausedRemainderSec.current = 0
    setSecondsRemaining(sprintTotal)
    setStatus('idle')
    return mins
  }, [getSprintElapsedMinutes, sprintTotal])

  return {
    status,
    phase,
    secondsRemaining,
    sprintTotalSeconds: sprintTotal,
    breakTotalSeconds: breakTotal,
    startSprint,
    pause,
    resume,
    beginBreak,
    skipBreak,
    resetToIdle,
    getSprintElapsedMinutes,
    endSprintEarly,
  }
}
