'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import BuddyEncouragementSection from '@/components/program/BuddyEncouragementSection'
import DailyLessonComponent from '@/components/program/DailyLesson'
import DistractionLog from '@/components/program/DistractionLog'
import EnergyLog from '@/components/program/EnergyLog'
import NextDayCountdown from '@/components/program/NextDayCountdown'
import OneBigTask from '@/components/program/OneBigTask'
import ProgramHeader from '@/components/program/ProgramHeader'
import { Tooltip } from '@/components/ui/first-visit-tooltip'
import { FEATURE_INTRO_TOOLTIP_TODAY } from '@/lib/feature-intro-tooltips'
import WeeklyReview, { isReviewDay } from '@/components/program/WeeklyReview'
import { useProgram } from '@/hooks/useProgram'
import { useProgramStatus } from '@/hooks/useProgramStatus'
import {
  getPublishedLessonsForDayAsync,
  inlineBonusTrackHasContent,
  type DailyLesson as DailyLessonData,
} from '@/lib/lessonContent'
import {
  dailyLessonFromPrimaryProgramRow,
  getDailyProgramBonusLessonForDay,
  getDailyProgramLessonForDay,
} from '@/lib/dailyProgramLessons'
import { supabase } from '@/lib/supabase'
import {
  getMaxDays,
  getProgramType,
  type ProgramType,
} from '@/lib/programUtils'
import { PU } from '@/lib/program-ui-tokens'
import {
  getTodayWakeTarget,
  getWakeComparisonMessage,
  saveWakeTarget,
} from '@/lib/wakeProgression'
import CommentList from '@/components/lesson/CommentList'
import { ProgramTrialBanner } from '@/components/TrialBanner'
import { getProgramEntryPath } from '@/lib/activeProgramClient'

function TodayPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { enrollment, loading, enrolled, refresh } = useProgram()
  const { activeProgram, loading: statusLoading } = useProgramStatus()
  const [lesson, setLesson] = useState<DailyLessonData | null>(null)
  const [bonusLesson, setBonusLesson] = useState<DailyLessonData | null>(null)
  const [bonusTabLabel, setBonusTabLabel] = useState('Bonus')
  const [activeTab, setActiveTab] = useState<'primary' | 'bonus'>('primary')
  const [lessonLoading, setLessonLoading] = useState(false)
  const [cmsLessonId, setCmsLessonId] = useState<string | null>(null)
  const [viewingDay, setViewingDay] = useState<number | null>(null)
  const [actionCompletedCurrent, setActionCompletedCurrent] = useState(false)
  const [programType, setProgramType] = useState<ProgramType>('60day')
  const [wakeTimeLogged, setWakeTimeLogged] = useState<string>('')
  const [wakeTarget, setWakeTarget] = useState<string | null>(null)
  const [wakeComparison, setWakeComparison] = useState<{
    onTrack: boolean
    message: string
    minutesDiff: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const path = await getProgramEntryPath(user.id)
      if (cancelled) return
      if (path === 'join') {
        router.replace('/join?trial=expired')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const programDay = activeProgram?.currentDay ?? enrollment?.currentDay ?? 1
  const displayDay = viewingDay ?? programDay
  const canGoBack = displayDay > 1
  const canGoForward = viewingDay !== null && viewingDay < programDay
  const isPastDay = viewingDay !== null && viewingDay < programDay
  const browsingHistory = viewingDay !== null

  useEffect(() => {
    const dayParam = searchParams.get('day')
    if (!dayParam) return
    const n = parseInt(dayParam, 10)
    if (Number.isFinite(n) && n >= 1) {
      setViewingDay(n)
    }
  }, [searchParams])

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
    if (!enrollment && !activeProgram) {
      setLesson(null)
      setBonusLesson(null)
      setBonusTabLabel('Bonus')
      setActiveTab('primary')
      setCmsLessonId(null)
      setLessonLoading(false)
      return
    }

    /** Avoid fetching with stale `activeProgram === null` before `/api/programs/status` resolves. */
    if (statusLoading) {
      setLessonLoading(true)
      return
    }

    const day = displayDay
    let cancelled = false
    async function fetchLesson() {
      setLessonLoading(true)
      if (activeProgram) {
        const row = await getDailyProgramLessonForDay(activeProgram.program_type, day)
        if (!row) {
          const published = await getPublishedLessonsForDayAsync(day)
          if (!cancelled) {
            setLesson(published.primary)
            setBonusLesson(published.bonus)
            setBonusTabLabel('Bonus')
            setActiveTab('primary')
            setCmsLessonId(null)
            setLessonLoading(false)
          }
          return
        }
        const primary = dailyLessonFromPrimaryProgramRow(day, row)
        const bonusPack = inlineBonusTrackHasContent(primary)
          ? { lesson: null as DailyLessonData | null, tabLabel: 'Bonus' as const }
          : await getDailyProgramBonusLessonForDay(activeProgram.program_type, day)
        if (!cancelled) {
          setLesson(primary)
          setBonusLesson(bonusPack.lesson)
          setBonusTabLabel(bonusPack.tabLabel)
          setActiveTab('primary')
          setCmsLessonId(row.id)
          setLessonLoading(false)
        }
        return
      }

      // Production users may have `program_enrollments.program_type` set (Sprint/Transform/etc.)
      // but no active `user_programs` row yet. In that case, still try to load the CMS lesson so
      // Discussions can attach to a real `daily_lessons.id`.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.id) {
          const pt = await getProgramType(user.id)
          if (pt !== '60day') {
            const row = await getDailyProgramLessonForDay(pt, day)
            if (row && !cancelled) {
              const primaryLesson = dailyLessonFromPrimaryProgramRow(day, row)
              const bonusPack = inlineBonusTrackHasContent(primaryLesson)
                ? { lesson: null as DailyLessonData | null, tabLabel: 'Bonus' as const }
                : await getDailyProgramBonusLessonForDay(pt, day)
              setLesson(primaryLesson)
              setBonusLesson(bonusPack.lesson)
              setBonusTabLabel(bonusPack.tabLabel)
              setActiveTab('primary')
              setCmsLessonId(row.id)
              setLessonLoading(false)
              return
            }
          }
        }
      } catch {
        // Fall through to the published lesson below.
      }

      const { primary, bonus } = await getPublishedLessonsForDayAsync(day)
      if (!cancelled) {
        setLesson(primary)
        setBonusLesson(bonus)
        setBonusTabLabel('Bonus')
        setActiveTab('primary')
        setCmsLessonId(null)
        setLessonLoading(false)
      }
    }
    void fetchLesson()
    return () => {
      cancelled = true
    }
  }, [enrollment, activeProgram, displayDay, statusLoading])

  useEffect(() => {
    if (!enrollment) {
      setWakeTarget(null)
      return
    }
    let cancelled = false
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const type = await getProgramType(user.id)
      if (cancelled) return
      setProgramType(type)
      const target = await getTodayWakeTarget(user.id, enrollment.currentDay, type)
      if (!cancelled) setWakeTarget(target)
    })()
    return () => {
      cancelled = true
    }
  }, [enrollment])

  useEffect(() => {
    if (!wakeTarget || !wakeTimeLogged) {
      setWakeComparison(null)
      return
    }
    setWakeComparison(getWakeComparisonMessage(wakeTimeLogged, wakeTarget))
  }, [wakeTarget, wakeTimeLogged])

  const onCompletionLoaded = useCallback((done: boolean) => {
    setActionCompletedCurrent(done)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[680px] px-6 pb-16 pt-4 md:pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            <span className="text-sm">Loading today&apos;s lesson…</span>
          </div>
        ) : null}

        {!loading && !enrolled ? (
          <Tooltip id="tooltip_today" text={FEATURE_INTRO_TOOLTIP_TODAY}>
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Start your journey</h2>
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
          </Tooltip>
        ) : null}

        {!loading && enrolled && enrollment?.status === 'paused' ? (
          <div
            style={{
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div style={{ maxWidth: '440px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏸</div>
              <h2
                style={{
                  color: 'white',
                  fontSize: '22px',
                  fontWeight: '600',
                  margin: '0 0 10px',
                }}
              >
                Program paused
              </h2>
              <p
                style={{
                  color: '#64748B',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: '0 0 24px',
                }}
              >
                Your streak is frozen and no new days will advance until you resume. You can resume from Settings.
              </p>
              <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 20px' }}>
                Day {enrollment.currentDay} of {getMaxDays(programType)}
              </p>
              <Link
                href="/settings"
                style={{
                  display: 'inline-block',
                  background: '#F59E0B',
                  color: '#000',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                Go to Settings to resume →
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && enrolled && enrollment && enrollment.status !== 'paused' ? (
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

            <ProgramTrialBanner />

            <Tooltip id="tooltip_today" text={FEATURE_INTRO_TOOLTIP_TODAY}>
              <ProgramHeader />
            </Tooltip>

            <BuddyEncouragementSection
              currentProgramDay={enrollment.currentDay}
              browsingHistory={browsingHistory}
            />

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
                    {viewingDay ? `Viewing Day ${viewingDay}` : `Today — Day ${programDay}`}
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
                      ✨ {bonusTabLabel}
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
                <CommentList
                  lessonId={cmsLessonId}
                  programType={activeProgram?.program_type}
                  day={displayDay}
                />
                {wakeTarget ? (
                  <div
                    style={{
                      background: '#1E293B',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid #334155',
                      marginBottom: '16px',
                    }}
                  >
                    <p
                      style={{
                        color: '#94A3B8',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 8px',
                      }}
                    >
                      Wake time check-in
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 4px' }}>Target</p>
                        <p
                          style={{
                            color: '#F59E0B',
                            fontSize: '18px',
                            fontWeight: '700',
                            margin: 0,
                          }}
                        >
                          {wakeTarget}
                        </p>
                      </div>

                      <div>
                        <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 4px' }}>
                          What time did you wake?
                        </p>
                        <input
                          type="time"
                          value={wakeTimeLogged}
                          onChange={(e) => {
                            const time = e.target.value
                            setWakeTimeLogged(time)
                            if (time && wakeTarget) {
                              const comparison = getWakeComparisonMessage(time, wakeTarget)
                              setWakeComparison(comparison)
                              void (async () => {
                                const {
                                  data: { user },
                                } = await supabase.auth.getUser()
                                if (user && enrollment) {
                                  await supabase.from('daily_actions').upsert(
                                    {
                                      user_id: user.id,
                                      day_number: enrollment.currentDay,
                                      wake_time_logged: time,
                                      program_type: programType,
                                    },
                                    { onConflict: 'user_id,day_number' },
                                  )
                                  await saveWakeTarget(
                                    user.id,
                                    enrollment.currentDay,
                                    programType,
                                    wakeTarget,
                                  )
                                }
                              })()
                            }
                          }}
                          style={{
                            background: '#0F172A',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {wakeComparison ? (
                      <p
                        style={{
                          color: wakeComparison.onTrack ? '#10B981' : '#F59E0B',
                          fontSize: '13px',
                          margin: '10px 0 0',
                          lineHeight: '1.5',
                        }}
                      >
                        {wakeComparison.onTrack ? '✓' : '💡'} {wakeComparison.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {actionCompletedCurrent && !viewingDay ? (
                  <NextDayCountdown startDate={enrollment.startDate} currentDay={enrollment.currentDay} />
                ) : null}
              </>
            ) : null}
            {!browsingHistory && enrollment.currentDay >= 3 ? (
              <DistractionLog dayNumber={enrollment.currentDay} />
            ) : null}
            {!browsingHistory && enrollment.currentDay >= 3 ? (
              <EnergyLog dayNumber={enrollment.currentDay} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <span className="text-sm">Loading…</span>
        </div>
      }
    >
      <TodayPageInner />
    </Suspense>
  )
}
