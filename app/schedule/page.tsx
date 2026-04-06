'use client'

import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { TimeScheduleCard } from '@/components/time-schedule-card'
import { useMonkData } from '@/hooks/use-monk-data'

export default function SchedulePage() {
  const { data, setData, ready } = useMonkData()

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Time Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan your day in blocks. Edits are saved with your dashboard data.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
        <TimeScheduleCard
          timeSlots={data.timeSlots}
          onTimeSlotsChange={(timeSlots) => setData({ ...data, timeSlots })}
        />
      </div>
    </div>
  )
}
