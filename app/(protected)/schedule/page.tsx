'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { flushSync } from 'react-dom'
import { startOfWeek } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { TimeScheduleCard } from '@/components/time-schedule-card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Card } from '@/components/ui/card'
import { useMonkData } from '@/hooks/use-monk-data'
import { useToast } from '@/context/ToastContext'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { usePlan } from '@/hooks/usePlan'
import {
  applyTimeBlockToPlannerWeek,
  newTimeSlotClientId,
  savePlannerSlot,
} from '@/lib/dataService'
import { morningRoutineTemplateSlots } from '@/lib/planner-templates'
import { TIME_SLOT_CATEGORY_OPTIONS } from '@/components/time-schedule-card'
import { Tooltip } from '@/components/ui/first-visit-tooltip'
import { TOOLTIP_TIME_SCHEDULE } from '@/lib/tool-library-tooltips'
import { captureEvent } from '@/lib/analytics'
import type { TimeSlot } from '@/lib/monk-types'
import ClearAllDataButton from '@/components/schedule/ClearAllDataButton'
import { supabase } from '@/lib/supabase'

export default function SchedulePage() {
  const { showToast } = useToast()
  const { openUpgrade } = useUpgradeOffer()
  const { isPro, isLoading: planLoading, trialExpired } = usePlan()
  const weekStartMonday = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  )
  const {
    data,
    setData,
    ready,
    dataContext,
    loadError,
    reload,
  } = useMonkData()
  const freeAfterTrial = !planLoading && !isPro && trialExpired
  const atTimeboxLimit = freeAfterTrial && data.timeSlots.length >= 1

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
    if (atTimeboxLimit) {
      openUpgrade({
        featureContext:
          'Free plan (after trial) includes 1 time block across the week. Upgrade for unlimited timeboxing.',
      })
      return
    }
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

  async function handleApplyToWeek(
    block: Pick<TimeSlot, 'time' | 'category' | 'activity' | 'colorClass'>,
    dayIndices: number[],
  ) {
    const r = await applyTimeBlockToPlannerWeek(
      dataContext,
      block,
      dayIndices,
      weekStartMonday,
    )
    if (r.error === 'SIGN_IN_REQUIRED') {
      showToast(
        'Pro sign-in is required to copy blocks into your synced planner.',
        'info',
      )
    } else if (r.error) {
      showToast(r.error, 'error')
    } else {
      showToast('Copied to selected days.', 'success')
    }
    return r
  }

  function applyMorningTemplate() {
    if (atTimeboxLimit) {
      openUpgrade({
        featureContext:
          'Free plan (after trial) includes 1 time block across the week. Upgrade for unlimited timeboxing.',
      })
      return
    }
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

  async function clearScheduleData() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token

    const res = await fetch('/api/schedule/clear', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      throw new Error(payload.error ?? `Clear failed (${res.status})`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {loadError ? (
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 md:pt-2">
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
        <Tooltip
          id="tooltip_schedule"
          text={TOOLTIP_TIME_SCHEDULE}
        >
          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="label-machine">System</div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                  Time schedule
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan your day in blocks. Edits are saved with your dashboard data.
                </p>
              </div>
              <ClearAllDataButton
                hasData={data.timeSlots.length > 0}
                onClear={async () => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('monk:schedule:cleared'))
                  }
                  await clearScheduleData()
                  try {
                    localStorage.removeItem('monk-dashboard-day-v1')
                  } catch {
                    /* ignore */
                  }
                  flushSync(() => {
                    setData((d) => ({ ...d, timeSlots: [] }))
                  })
                  showToast('Cleared schedule data.', 'success')
                }}
              />
            </div>
            <Link
              href="/dashboard"
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              ← Back to dashboard
            </Link>
          </div>
        </Tooltip>
        {data.timeSlots.length === 0 ? (
          <Card className="p-4 mb-6">
            <EmptyState
              icon="📅"
              heading="Your day is unscheduled"
              subtext="Block deep work, breaks, and meetings so your day has a plan before it runs you."
              ctaLabel="Add your first time block"
              ctaAction={addFirstSlot}
              secondaryLabel="Apply morning routine template"
              secondaryAction={applyMorningTemplate}
            />
          </Card>
        ) : null}
        <TimeScheduleCard
          timeSlots={data.timeSlots}
          onTimeSlotsChange={(next) => {
            setData((d) => {
              const timeSlots =
                typeof next === 'function' ? next(d.timeSlots) : next
              void persistSlots(timeSlots)
              return { ...d, timeSlots }
            })
          }}
          getNewSlotId={() => newTimeSlotClientId(dataContext)}
          onApplyTimeBlockToWeek={handleApplyToWeek}
          showPlannerLink={false}
          addDisabled={atTimeboxLimit}
          onAddDisabledClick={() =>
            openUpgrade({
              featureContext:
                'Free plan (after trial) includes 1 time block across the week. Upgrade for unlimited timeboxing.',
            })
          }
        />
      </div>
      ) : null}
    </div>
  )
}
