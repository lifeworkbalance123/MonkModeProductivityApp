'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import DailyLessonComponent from '@/components/program/DailyLesson'
import DistractionLog from '@/components/program/DistractionLog'
import EnergyLog from '@/components/program/EnergyLog'
import NextDayCountdown from '@/components/program/NextDayCountdown'
import OneBigTask from '@/components/program/OneBigTask'
import ProgramHeader from '@/components/program/ProgramHeader'
import WeeklyReview, { isReviewDay } from '@/components/program/WeeklyReview'
import { Navigation } from '@/components/navigation'
import { useProgram } from '@/hooks/useProgram'
import {
  getPublishedLessonsForDayAsync,
  type DailyLesson as DailyLessonData,
} from '@/lib/lessonContent'
import { PU } from '@/lib/program-ui-tokens'

export default function TodayPage() {
  const { enrollment, loading, enrolled, refresh } = useProgram()
  const [lesson, setLesson] = useState<DailyLessonData | null>(null)
  const [bonusLesson, setBonusLesson] = useState<DailyLessonData | null>(null)
  const [activeTab, setActiveTab] = useState<'primary' | 'bonus'>('primary')
  const [lessonLoading, setLessonLoading] = useState(false)
  const [viewingDay, setViewingDay] = useState<number | null>(null)
  const [actionCompletedCurrent, setActionCompletedCurrent] = useState(false)

  const programDay = enrollment?.currentDay ?? 1
  const displayDay = viewingDay ?? programDay
  const canGoBack = displayDay > 1
  const canGoForward = viewingDay !== null && viewingDay < programDay
  const isPastDay = viewingDay !== null && viewingDay < programDay
  const browsingHistory = viewingDay !== null

  useEffect(() => {
    if (viewingDay != null && enrollment && viewingDay > enrollment.currentDay) {
      setViewingDay(null)
    }
  }, [enrollment, viewingDay])

  useEffect(() => {
    if (viewingDay !== null) {
      setActionCompletedCurrent(false)
    }
  }, [viewingDay])

  useEffect(() => {
    if (!enrollment) {
      setLesson(null)
      setBonusLesson(null)
      setActiveTab('primary')
      setLessonLoading(false)
      return
    }
    const day = displayDay
    let cancelled = false
    async function fetchLesson() {
      setLessonLoading(true)
      const { primary, bonus } = await getPublishedLessonsForDayAsync(day)
      if (!cancelled) {
        setLesson(primary)
        setBonusLesson(bonus)
        setActiveTab('primary')
        setLessonLoading(false)
      }
    }
    void fetchLesson()
    return () => {
      cancelled = true
    }
  }, [enrollment, displayDay])

  const onCompletionLoaded = useCallback((done: boolean) => {
    setActionCompletedCurrent(done)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-[680px] px-6 pb-16 pt-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            <span className="text-sm">Loading today&apos;s lesson…</span>
          </div>
        ) : null}

        {!loading && !enrolled ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-foreground">Start your 60-day journey</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Enroll in the program to unlock your daily lesson and one-tap action.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Begin Day 1 →
            </Link>
          </div>
        ) : null}

        {!loading && enrolled && enrollment ? (
          <>
            {enrollment.isTestMode ? (
              <div
                style={{
                  background: `color-mix(in srgb, ${PU.primary} 14%, ${PU.card})`,
                  border: `1px solid color-mix(in srgb, ${PU.primary} 45%, transparent)`,
                  borderRadius: '10px',
                  padding: '10px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🧪</span>
                  <span style={{ color: PU.fg, fontSize: '13px', fontWeight: '500' }}>
                    Test mode active — viewing Day {enrollment.currentDay} (real calendar day not used for
                    gating)
                  </span>
                </div>
                <Link
                  href="/admin/users"
                  style={{
                    color: PU.primary,
                    fontSize: '12px',
                    textDecoration: 'none',
                  }}
                >
                  Change day →
                </Link>
              </div>
            ) : null}

            <ProgramHeader />

            {enrollment.currentDay > 1 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  background: PU.card,
                  borderRadius: '10px',
                  padding: '10px 16px',
                  border: `1px solid ${PU.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewingDay(Math.max(1, displayDay - 1))}
                  disabled={!canGoBack}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: canGoBack ? PU.primary : PU.muted,
                    cursor: canGoBack ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    padding: '4px 8px',
                  }}
                >
                  ← Previous day
                </button>

                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      color: viewingDay ? PU.mutedFg : PU.fg,
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    {viewingDay ? `Viewing Day ${viewingDay}` : `Today — Day ${enrollment.currentDay}`}
                  </span>
                  {viewingDay ? (
                    <button
                      type="button"
                      onClick={() => setViewingDay(null)}
                      style={{
                        display: 'block',
                        background: 'transparent',
                        border: 'none',
                        color: PU.primary,
                        cursor: 'pointer',
                        fontSize: '12px',
                        margin: '2px auto 0',
                      }}
                    >
                      Back to today →
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = displayDay + 1
                    if (next <= enrollment.currentDay) {
                      setViewingDay(next === enrollment.currentDay ? null : next)
                    }
                  }}
                  disabled={!canGoForward}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: canGoForward ? PU.primary : PU.muted,
                    cursor: canGoForward ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    padding: '4px 8px',
                  }}
                >
                  Next day →
                </button>
              </div>
            ) : null}

            {!browsingHistory && enrollment.currentDay >= 2 ? (
              <OneBigTask dayNumber={enrollment.currentDay} />
            ) : null}
            {!browsingHistory && isReviewDay(enrollment.currentDay) ? (
              <WeeklyReview dayNumber={enrollment.currentDay} />
            ) : null}
            {lessonLoading ? (
              <div
                className="mb-6 rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground"
                aria-busy="true"
              >
                Loading today&apos;s lesson…
              </div>
            ) : lesson ? (
              <>
                {bonusLesson ? (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('primary')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        background: activeTab === 'primary' ? PU.primary : PU.muted,
                        color: activeTab === 'primary' ? PU.primaryFg : PU.mutedFg,
                      }}
                    >
                      Today&apos;s Lesson
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bonus')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1px solid color-mix(in srgb, ${PU.chart2} 55%, transparent)`,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        background:
                          activeTab === 'bonus'
                            ? `color-mix(in srgb, ${PU.chart2} 85%, ${PU.card})`
                            : 'transparent',
                        color: activeTab === 'bonus' ? PU.fg : PU.chart2,
                      }}
                    >
                      ✨ Bonus Lesson
                    </button>
                  </div>
                ) : null}
                <DailyLessonComponent
                  key={activeTab === 'bonus' && bonusLesson ? 'bonus' : 'primary'}
                  dayNumber={displayDay}
                  lesson={activeTab === 'bonus' && bonusLesson ? bonusLesson : lesson}
                  readOnly={isPastDay}
                  onCompletionLoaded={onCompletionLoaded}
                  onComplete={() => void refresh()}
                />
                {actionCompletedCurrent && !viewingDay ? (
                  <NextDayCountdown startDate={enrollment.startDate} currentDay={enrollment.currentDay} />
                ) : null}
              </>
            ) : null}
            {!browsingHistory && enrollment.currentDay >= 3 ? (
              <DistractionLog dayNumber={enrollment.currentDay} />
            ) : null}
            {!browsingHistory && enrollment.currentDay >= 7 ? (
              <EnergyLog dayNumber={enrollment.currentDay} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
