'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const REVIEW_DAYS = [7, 14, 21, 28, 35, 42, 49, 56] as const

export function isReviewDay(dayNumber: number): boolean {
  return (REVIEW_DAYS as readonly number[]).includes(dayNumber)
}

export function getWeekNumber(dayNumber: number): number {
  return Math.ceil(dayNumber / 7)
}

export default function WeeklyReview({ dayNumber }: { dayNumber: number }) {
  const [whatWorked, setWhatWorked] = useState('')
  const [whatDidnt, setWhatDidnt] = useState('')
  const [oneChange, setOneChange] = useState('')
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const weekNumber = getWeekNumber(dayNumber)

  const loadReview = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_number', weekNumber)
        .maybeSingle()

      if (error) {
        console.error('weekly_reviews load:', error)
        return
      }

      if (data) {
        setWhatWorked((data.what_worked as string) ?? '')
        setWhatDidnt((data.what_didnt as string) ?? '')
        setOneChange((data.one_change as string) ?? '')
        setCompleted(!!data.completed)
      }
    } finally {
      setLoading(false)
    }
  }, [weekNumber])

  useEffect(() => {
    void loadReview()
  }, [loadReview])

  async function saveReview() {
    const w = whatWorked.trim()
    const d = whatDidnt.trim()
    const o = oneChange.trim()
    if (!w || !d || !o) return

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('weekly_reviews').upsert(
        {
          user_id: user.id,
          week_number: weekNumber,
          day_number: dayNumber,
          what_worked: w,
          what_didnt: d,
          one_change: o,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,week_number' },
      )

      if (error) {
        console.error('weekly_reviews upsert:', error)
        return
      }

      setCompleted(true)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    whatWorked.trim().length > 0 &&
    whatDidnt.trim().length > 0 &&
    oneChange.trim().length > 0

  if (loading) return null

  if (completed) {
    return (
      <div
        style={{
          background: '#1E293B',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #10B98144',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <p style={{ color: 'white', fontWeight: '500', margin: '0 0 2px', fontSize: '14px' }}>
              Week {weekNumber} Review Complete
            </p>
            <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>
              Your one change: &ldquo;{oneChange}&rdquo;
            </p>
          </div>
        </div>
      </div>
    )
  }

  const textareaStyle = {
    width: '100%',
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    lineHeight: '1.6',
  }

  const nextWeek = weekNumber >= 8 ? 'the home stretch' : `week ${weekNumber + 1}`

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #8B5CF644',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>🔍</span>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 2px' }}>
            Week {weekNumber} Review
          </h2>
          <p style={{ color: '#8B5CF6', fontSize: '13px', margin: 0 }}>
            Take 5 minutes to reflect before moving to {nextWeek}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            color: '#10B981',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          What worked this week?
        </label>
        <textarea
          rows={3}
          placeholder="Which habits stuck? What felt natural? What gave you energy?"
          value={whatWorked}
          onChange={(e) => setWhatWorked(e.target.value)}
          style={textareaStyle}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          What did not work?
        </label>
        <textarea
          rows={3}
          placeholder="Which habits did you skip? What drained you? Where did you lose focus?"
          value={whatDidnt}
          onChange={(e) => setWhatDidnt(e.target.value)}
          style={textareaStyle}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            color: '#F59E0B',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          One change for next week
        </label>
        <textarea
          rows={2}
          placeholder="Just one. What single change would make next week significantly better?"
          value={oneChange}
          onChange={(e) => setOneChange(e.target.value)}
          style={textareaStyle}
        />
      </div>

      <button
        type="button"
        onClick={() => void saveReview()}
        disabled={saving || !canSubmit}
        style={{
          width: '100%',
          background: canSubmit ? '#8B5CF6' : '#334155',
          color: canSubmit ? 'white' : '#64748B',
          border: 'none',
          borderRadius: '10px',
          padding: '13px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: saving || !canSubmit ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Complete week review →'}
      </button>
    </div>
  )
}
