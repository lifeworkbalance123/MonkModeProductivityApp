'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { TimeScheduleCard } from '@/components/time-schedule-card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Card } from '@/components/ui/card'
import { useMonkData } from '@/hooks/use-monk-data'
import { useToast } from '@/context/ToastContext'
import {
  newTimeSlotClientId,
  savePlannerSlot,
} from '@/lib/dataService'
import { morningRoutineTemplateSlots } from '@/lib/planner-templates'
import { TIME_SLOT_CATEGORY_OPTIONS } from '@/components/time-schedule-card'
import { captureEvent } from '@/lib/analytics'

export default function SchedulePage() {
  const { showToast } = useToast()
  const {
    data,
    setData,
    ready,
    dataContext,
    loadError,
    reload,
  } = useMonkData()

  async function persistSlots(timeSlots: typeof data.timeSlots) {
    const results = await Promise.all(
      timeSlots.map((slot) => savePlannerSlot(dataContext, slot)),
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      showToast("Couldn't save changes. Please try again.", 'error')
    }
  }

  function addFirstSlot() {
    const c = TIME_SLOT_CATEGORY_OPTIONS[0]
    const slot = {
      id: newTimeSlotClientId(dataContext),
      time: '09:00',
      category: c.label,
      activity: '',
      colorClass: c.colorClass,
    }
    const next = [...data.timeSlots, slot]
    setData({ ...data, timeSlots: next })
    void persistSlots(next)
    captureEvent('planner_slot_added', {
      category: slot.category,
      time_slot: slot.time,
    })
  }

  function applyMorningTemplate() {
    const slots = morningRoutineTemplateSlots(() =>
      newTimeSlotClientId(dataContext),
    )
    setData({ ...data, timeSlots: slots })
    void persistSlots(slots)
    captureEvent('planner_slot_added', {
      category: 'template',
      time_slot: 'morning-routine',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {loadError ? (
        <div className="max-w-3xl mx-auto px-4 pt-20 pb-2">
          <ErrorBanner
            message={loadError}
            onRetry={() => void reload()}
          />
        </div>
      ) : null}
      {!ready ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Loading data</span>
        </div>
      ) : null}
      {ready ? (
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
        {data.timeSlots.length === 0 ? (
          <Card className="p-4 mb-6">
            <EmptyState
              icon="📅"
              heading="Your day is unscheduled"
              subtext="Time-boxing your day is the single highest leverage habit you can build."
              ctaLabel="Add your first time block"
              ctaAction={addFirstSlot}
              secondaryLabel="Apply morning routine template"
              secondaryAction={applyMorningTemplate}
            />
          </Card>
        ) : null}
        <TimeScheduleCard
          timeSlots={data.timeSlots}
          onTimeSlotsChange={(timeSlots) => {
            setData({ ...data, timeSlots })
            void persistSlots(timeSlots)
          }}
        />
      </div>
      ) : null}
    </div>
  )
}
