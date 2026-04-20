'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyLesson as DailyLessonType } from '@/lib/lessonContent'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MilestoneCelebrationPayload } from '@/lib/milestoneCelebration'
import { markDayComplete, PROGRAM_LABELS } from '@/lib/programUtils'
import LessonMedia from '@/components/program/LessonMedia'
import { PU } from '@/lib/program-ui-tokens'

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
  const [milestone, setMilestone] = useState<MilestoneCelebrationPayload | null>(null)

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

      const completeResult = await markDayComplete(user.id, dayNumber)
      if (completeResult.ok && completeResult.milestone) {
        setMilestone(completeResult.milestone)
      }

      setCompleted(true)
      if (lesson?.tip) setShowTip(true)
      onCompletionLoaded?.(true)
      onComplete?.()
    } finally {
      setCompleting(false)
    }
  }

  return (
    <>
    <div
      style={{
        background: PU.card,
        borderRadius: '16px',
        border: `1px solid ${PU.border}`,
        overflow: 'hidden',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          background: PU.bg,
          padding: '16px 20px',
          borderBottom: `1px solid ${PU.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: PU.primary,
              color: PU.primaryFg,
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
                background: PU.muted,
                color: PU.mutedFg,
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
              color: PU.mutedFg,
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            {lesson.category}
          </span>
          {lesson.isBonus ? (
            <span
              style={{
                background: `color-mix(in srgb, ${PU.chart2} 35%, ${PU.card})`,
                color: PU.fg,
                fontSize: '10px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
                border: `1px solid color-mix(in srgb, ${PU.chart2} 50%, transparent)`,
              }}
            >
              ✨ Bonus
            </span>
          ) : null}
        </div>
        {loading ? (
          <span style={{ color: PU.mutedFg, fontSize: '12px' }} aria-busy="true">
            Checking…
          </span>
        ) : completed || readOnly ? (
          <span style={{ color: PU.success, fontSize: '13px', fontWeight: '500' }}>✓ Completed</span>
        ) : null}
      </div>

      <div style={{ padding: '20px' }}>
        <h2
          style={{
            color: PU.fg,
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
              color: PU.mutedFg,
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
                background: `linear-gradient(transparent, ${PU.card})`,
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
            color: PU.primary,
            fontSize: '13px',
            cursor: 'pointer',
            padding: '8px 0',
            display: 'block',
          }}
        >
          {expanded ? '↑ Show less' : '↓ Read full lesson'}
        </button>

        <LessonMedia
          mediaType={lesson.media_type}
          mediaUrl={lesson.media_url}
          companionMediaType={lesson.companion_media_type}
          companionMediaUrl={lesson.companion_media_url}
        />

        <div
          style={{
            background: PU.bg,
            borderRadius: '10px',
            padding: '16px',
            marginTop: '16px',
            border: `1px solid ${PU.border}`,
          }}
        >
          <p
            style={{
              color: PU.mutedFg,
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 8px',
            }}
          >
            Today&apos;s action
          </p>
          <p style={{ color: PU.fg, fontSize: '15px', margin: '0 0 16px', lineHeight: '1.6' }}>
            {lesson.action}
          </p>

          {!completed && !readOnly ? (
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={completing}
              style={{
                width: '100%',
                background: PU.primary,
                color: PU.primaryFg,
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
                background: `color-mix(in srgb, ${PU.success} 18%, ${PU.bg})`,
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'center',
                border: `1px solid color-mix(in srgb, ${PU.success} 45%, transparent)`,
                color: PU.success,
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
              background: `color-mix(in srgb, ${PU.success} 12%, ${PU.card})`,
              border: `1px solid color-mix(in srgb, ${PU.success} 40%, transparent)`,
              borderRadius: '10px',
              padding: '14px',
              marginTop: '12px',
              color: PU.fg,
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

    <Dialog open={milestone !== null} onOpenChange={(open) => !open && setMilestone(null)}>
      <DialogContent className="border-amber-500/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl" aria-hidden>
              🏅
            </span>
            Milestone unlocked
          </DialogTitle>
          <DialogDescription>You reached a program milestone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-left text-sm">
          <p className="font-semibold text-foreground">{milestone?.milestoneName}</p>
          <p className="text-muted-foreground">
            {milestone ? PROGRAM_LABELS[milestone.programType] : ''} · Day {milestone?.milestoneDay}
          </p>
          {milestone?.restPeriodEndsAt ? (
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-foreground">
              Optional rest day: take a lighter schedule until{' '}
              <span className="font-medium">
                {new Date(milestone.restPeriodEndsAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              .
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">Your progress snapshot was saved for analytics.</p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
