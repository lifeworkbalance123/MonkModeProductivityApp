'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import DailyLesson from '@/components/program/DailyLesson'
import DistractionLog from '@/components/program/DistractionLog'
import EnergyLog from '@/components/program/EnergyLog'
import ProgramHeader from '@/components/program/ProgramHeader'
import WeeklyReview, { isReviewDay } from '@/components/program/WeeklyReview'
import { Navigation } from '@/components/navigation'
import { useProgram } from '@/hooks/useProgram'

export default function TodayPage() {
  const { enrollment, loading, enrolled, refresh } = useProgram()

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
            <ProgramHeader />
            {isReviewDay(enrollment.currentDay) ? (
              <WeeklyReview dayNumber={enrollment.currentDay} />
            ) : null}
            <DailyLesson dayNumber={enrollment.currentDay} onComplete={() => void refresh()} />
            {enrollment.currentDay >= 3 ? (
              <DistractionLog dayNumber={enrollment.currentDay} />
            ) : null}
            {enrollment.currentDay >= 7 ? (
              <EnergyLog dayNumber={enrollment.currentDay} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
