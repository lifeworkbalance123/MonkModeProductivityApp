'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserIdSafe } from '@/lib/supabaseAuthSafe'
import { useProgram } from '@/hooks/useProgram'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getMaxDays,
  getProgramType,
  pauseProgram,
  PROGRAM_LABELS,
  restartProgram,
  resumeProgram,
  type ProgramType,
} from '@/lib/programUtils'

export default function ProgramControls() {
  const { enrollment, loading } = useProgram()
  const router = useRouter()
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState('')
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [programType, setProgramType] = useState<ProgramType>('60day')

  useEffect(() => {
    void (async () => {
      const userId = await getUserIdSafe()
      if (!userId) return
      setProgramType(await getProgramType(userId))
    })()
  }, [])

  async function handlePause() {
    setActing(true)
    setMessage('')
    const userId = await getUserIdSafe()
    if (!userId) {
      setActing(false)
      return
    }

    const ok = await pauseProgram(userId)
    setMessage(ok ? '✓ Program paused. Your streak is frozen.' : '✗ Could not pause. Try again.')
    setActing(false)
    if (ok) router.refresh()
  }

  async function handleResume() {
    setActing(true)
    setMessage('')
    const userId = await getUserIdSafe()
    if (!userId) {
      setActing(false)
      return
    }

    const ok = await resumeProgram(userId)
    setMessage(ok ? '✓ Program resumed. Keep going!' : '✗ Could not resume. Try again.')
    setActing(false)
    if (ok) router.refresh()
  }

  async function handleRestart() {
    setActing(true)
    setMessage('')
    const userId = await getUserIdSafe()
    if (!userId) {
      setActing(false)
      return
    }

    const ok = await restartProgram(userId)
    setMessage(ok ? '✓ Program reset to Day 1.' : '✗ Could not restart. Try again.')
    setActing(false)
    setShowRestartConfirm(false)
    if (ok) router.push('/today')
  }

  if (loading || !enrollment) return null

  const isPaused = enrollment.status === 'paused'
  const isCompleted = enrollment.status === 'completed'
  const maxDays = getMaxDays(programType)

  return (
    <Card className="mb-6 border-border bg-card/80 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">🧘 Program Controls</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Day {enrollment.currentDay} of {maxDays} ({PROGRAM_LABELS[programType]}) ·{' '}
            <span
              className={cn(
                'font-semibold capitalize',
                isPaused
                  ? 'text-amber-400'
                  : isCompleted
                    ? 'text-purple-400'
                    : 'text-emerald-400',
              )}
            >
              {enrollment.status || 'active'}
            </span>
          </p>
        </div>
      </div>

      <div className={cn('mt-4 flex flex-wrap gap-2', message && 'mb-3')}>
        {!isPaused && !isCompleted ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handlePause()}
            disabled={acting}
            className="min-h-10"
          >
            {acting ? '…' : '⏸ Pause program'}
          </Button>
        ) : null}

        {isPaused ? (
          <Button
            type="button"
            onClick={() => void handleResume()}
            disabled={acting}
            className="min-h-10 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {acting ? '…' : '▶ Resume program'}
          </Button>
        ) : null}

        {!showRestartConfirm ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRestartConfirm(true)}
            className="min-h-10 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            ↺ Restart from Day 1
          </Button>
        ) : null}
      </div>

      {showRestartConfirm ? (
        <div className="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive/90">
            <strong>⚠️ Heads up:</strong> This resets your program to Day 1 and clears completed days.
            This cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRestart()}
              disabled={acting}
              className="min-h-10"
            >
              {acting ? 'Resetting…' : 'Yes, restart'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRestartConfirm(false)}
              className="min-h-10"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={cn(
            'text-sm',
            message.startsWith('✓') ? 'text-emerald-400' : 'text-destructive',
          )}
        >
          {message}
        </p>
      ) : null}

      {isPaused ? (
        <p className="mt-2 text-xs italic text-muted-foreground">
          Program paused — your streak is frozen and no new days will advance until you resume.
        </p>
      ) : null}
    </Card>
  )
}
