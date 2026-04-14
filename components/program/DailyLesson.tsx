'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyLesson as DailyLessonType } from '@/lib/lessonContent'
import { markDayComplete } from '@/lib/programUtils'
import LessonMedia from '@/components/program/LessonMedia'

type DailyLessonProps = {
  dayNumber: number
  lesson: DailyLessonType
  onComplete?: () => void
  /** Past-day archive: no complete action, read-only UI */
  readOnly?: boolean
  /** Report completion state for the visible day (skipped when readOnly) */
  onCompletionLoaded?: (completed: boolean) => void
}

export default function DailyLesson({
  dayNumber,
  lesson,
  onComplete,
  readOnly = false,
  onCompletionLoaded,
}: DailyLessonProps) {
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const checkCompletion = useCallback(async () => {
    setLoading(true)
    try {
      if (readOnly) {
        setCompleted(true)
        return
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setCompleted(false)
        return
      }

      const { data } = await supabase
        .from('daily_actions')
        .select('completed')
        .eq('user_id', user.id)
        .eq('day_number', dayNumber)
        .maybeSingle()

      setCompleted(!!data?.completed)
    } finally {
      setLoading(false)
    }
  }, [dayNumber, readOnly])

  useEffect(() => {
    void checkCompletion()
  }, [checkCompletion])

  useEffect(() => {
    if (readOnly || loading) return
    onCompletionLoaded?.(completed)
  }, [readOnly, loading, completed, onCompletionLoaded])

  async function handleComplete() {
    if (readOnly) return
    setCompleting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error: upsertError } = await supabase.from('daily_actions').upsert(
        {
          user_id: user.id,
          day_number: dayNumber,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day_number' },
      )

      if (upsertError) {
        console.error('daily_actions upsert:', upsertError)
        return
      }

      await markDayComplete(user.id, dayNumber)

      setCompleted(true)
      if (lesson?.tip) setShowTip(true)
      onCompletionLoaded?.(true)
      onComplete?.()
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #334155',
        overflow: 'hidden',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          background: '#0F172A',
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#F59E0B',
              color: '#000',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 10px',
              borderRadius: '4px',
            }}
          >
            DAY {dayNumber}
          </span>
          {readOnly ? (
            <span
              style={{
                background: '#334155',
                color: '#94A3B8',
                fontSize: '10px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              Past lesson — read only
            </span>
          ) : null}
          <span
            style={{
              color: '#64748B',
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            {lesson.category}
          </span>
          {lesson.isBonus ? (
            <span
              style={{
                background: '#4C1D95',
                color: '#C4B5FD',
                fontSize: '10px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              ✨ Bonus
            </span>
          ) : null}
        </div>
        {loading ? (
          <span style={{ color: '#64748B', fontSize: '12px' }} aria-busy="true">
            Checking…
          </span>
        ) : completed || readOnly ? (
          <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '500' }}>✓ Completed</span>
        ) : null}
      </div>

      <div style={{ padding: '20px' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 16px',
            lineHeight: '1.3',
          }}
        >
          {lesson.title}
        </h2>

        <div
          style={{
            position: 'relative',
            overflow: expanded ? 'visible' : 'hidden',
            maxHeight: expanded ? 'none' : '120px',
          }}
        >
          <p
            style={{
              color: '#94A3B8',
              fontSize: '15px',
              lineHeight: '1.8',
              margin: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {lesson.lesson}
          </p>
          {!expanded ? (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60px',
                background: 'linear-gradient(transparent, #1E293B)',
              }}
            />
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F59E0B',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '8px 0',
            display: 'block',
          }}
        >
          {expanded ? '↑ Show less' : '↓ Read full lesson'}
        </button>

        <LessonMedia mediaType={lesson.media_type} mediaUrl={lesson.media_url} />

        <div
          style={{
            background: '#0F172A',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '16px',
            border: '1px solid #334155',
          }}
        >
          <p
            style={{
              color: '#64748B',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 8px',
            }}
          >
            Today&apos;s action
          </p>
          <p style={{ color: '#CBD5E1', fontSize: '15px', margin: '0 0 16px', lineHeight: '1.6' }}>
            {lesson.action}
          </p>

          {!completed && !readOnly ? (
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={completing}
              style={{
                width: '100%',
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: completing ? 'wait' : 'pointer',
                transition: 'transform 0.1s, opacity 0.1s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.01)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {completing ? 'Saving…' : lesson.actionLabel}
            </button>
          ) : (
            <div
              style={{
                background: '#065F46',
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'center',
                color: '#10B981',
                fontSize: '15px',
                fontWeight: '600',
                opacity: readOnly ? 0.85 : 1,
              }}
            >
              ✓ {lesson.actionLabel}
            </div>
          )}
        </div>

        {showTip && lesson.tip ? (
          <div
            style={{
              background: '#1E3A2F',
              border: '1px solid #10B981',
              borderRadius: '10px',
              padding: '14px',
              marginTop: '12px',
              color: '#6EE7B7',
              fontSize: '14px',
              lineHeight: '1.6',
              transition: 'opacity 0.3s ease',
            }}
          >
            💡 {lesson.tip}
          </div>
        ) : null}
      </div>
    </div>
  )
}
