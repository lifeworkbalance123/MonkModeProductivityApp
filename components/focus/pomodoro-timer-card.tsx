'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer } from 'lucide-react'

const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60

export function PomodoroTimerCard() {
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle')
  const [secLeft, setSecLeft] = useState(WORK_SEC)
  const wallEnd = useRef<number | null>(null)
  const pausedRemainder = useRef(0)
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const total = mode === 'work' ? WORK_SEC : BREAK_SEC

  const sync = useCallback(() => {
    if (wallEnd.current == null) return
    const s = Math.max(0, Math.ceil((wallEnd.current - Date.now()) / 1000))
    setSecLeft(s)
    if (s === 0) {
      wallEnd.current = null
      setMode((m) => (m === 'work' ? 'break' : 'work'))
      setStatus('idle')
    }
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
    if (status === 'idle') {
      setSecLeft(total)
    }
  }, [mode, total, status])

  function start() {
    wallEnd.current = Date.now() + secLeft * 1000
    setStatus('running')
  }

  function pause() {
    if (statusRef.current !== 'running' || wallEnd.current == null) return
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
    wallEnd.current = Date.now() + s * 1000
    setStatus('running')
  }

  function reset() {
    wallEnd.current = null
    setStatus('idle')
    setSecLeft(total)
  }

  const mm = String(Math.floor(secLeft / 60)).padStart(2, '0')
  const ss = String(secLeft % 60).padStart(2, '0')

  return (
    <Card className="p-6 border-border">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold">Pomodoro</h2>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {mode === 'work' ? 'Focus' : 'Break'}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        25-minute focus blocks with a 5-minute break. Classic cadence for daily
        tasks.
      </p>
      <div className="text-center">
        <p className="text-5xl font-mono font-bold tabular-nums tracking-tight">
          {mm}:{ss}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {status === 'idle' ? (
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
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
