'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useProgram } from '@/hooks/useProgram'
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setProgramType(await getProgramType(user.id))
    })()
  }, [])

  async function handlePause() {
    setActing(true)
    setMessage('')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setActing(false)
      return
    }

    const ok = await pauseProgram(user.id)
    setMessage(ok ? '✓ Program paused. Your streak is frozen.' : '✗ Could not pause. Try again.')
    setActing(false)
    if (ok) router.refresh()
  }

  async function handleResume() {
    setActing(true)
    setMessage('')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setActing(false)
      return
    }

    const ok = await resumeProgram(user.id)
    setMessage(ok ? '✓ Program resumed. Keep going!' : '✗ Could not resume. Try again.')
    setActing(false)
    if (ok) router.refresh()
  }

  async function handleRestart() {
    setActing(true)
    setMessage('')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setActing(false)
      return
    }

    const ok = await restartProgram(user.id)
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
    <div
      style={{
        background: '#1E293B',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '1px solid #334155',
        marginBottom: '24px',
      }}
    >
      <h3
        style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '500',
          margin: '0 0 4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        🧘 Program Controls
      </h3>
      <p
        style={{
          color: '#64748B',
          fontSize: '13px',
          margin: '0 0 16px',
        }}
      >
        Day {enrollment.currentDay} of {maxDays} ({PROGRAM_LABELS[programType]}) ·
        <span
          style={{
            color: isPaused ? '#F59E0B' : isCompleted ? '#8B5CF6' : '#10B981',
            marginLeft: '6px',
            fontWeight: '500',
            textTransform: 'capitalize',
          }}
        >
          {enrollment.status || 'active'}
        </span>
      </p>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: message ? '12px' : 0,
        }}
      >
        {!isPaused && !isCompleted ? (
          <button
            onClick={() => void handlePause()}
            disabled={acting}
            style={{
              background: '#1E293B',
              border: '1px solid #F59E0B44',
              color: '#F59E0B',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: acting ? 'wait' : 'pointer',
              fontSize: '13px',
            }}
          >
            {acting ? '...' : '⏸ Pause program'}
          </button>
        ) : null}

        {isPaused ? (
          <button
            onClick={() => void handleResume()}
            disabled={acting}
            style={{
              background: '#F59E0B',
              border: 'none',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: acting ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {acting ? '...' : '▶ Resume program'}
          </button>
        ) : null}

        {!showRestartConfirm ? (
          <button
            onClick={() => setShowRestartConfirm(true)}
            style={{
              background: 'transparent',
              border: '1px solid #EF444444',
              color: '#EF4444',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ↺ Restart from Day 1
          </button>
        ) : (
          <div
            style={{
              background: '#1E293B',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              padding: '12px 16px',
              width: '100%',
            }}
          >
            <p
              style={{
                color: '#FCA5A5',
                fontSize: '13px',
                margin: '0 0 10px',
                lineHeight: '1.5',
              }}
            >
              ⚠️ This will reset your program to Day 1 and clear your completed days. This cannot be undone.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                onClick={() => void handleRestart()}
                disabled={acting}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: acting ? 'wait' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {acting ? 'Resetting...' : 'Yes, restart'}
              </button>
              <button
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  background: '#334155',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message ? (
        <p
          style={{
            color: message.startsWith('✓') ? '#10B981' : '#EF4444',
            fontSize: '13px',
            margin: 0,
          }}
        >
          {message}
        </p>
      ) : null}

      {isPaused ? (
        <p
          style={{
            color: '#64748B',
            fontSize: '12px',
            margin: '8px 0 0',
            fontStyle: 'italic',
          }}
        >
          Program paused - your streak is frozen and no new days will advance until you resume.
        </p>
      ) : null}
    </div>
  )
}
