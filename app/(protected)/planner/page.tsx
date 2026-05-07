'use client'

import { Loader2 } from 'lucide-react'
import { WeeklyPlannerApp } from '@/components/weekly-planner-app'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Card } from '@/components/ui/card'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import {
  newTimeSlotClientId,
  savePlannerSlot,
} from '@/lib/dataService'
import { morningRoutineTemplateSlots } from '@/lib/planner-templates'
import { TIME_SLOT_CATEGORY_OPTIONS } from '@/components/time-schedule-card'
import { captureEvent } from '@/lib/analytics'

export default function PlannerPage() {
  const {
    data,
    setData,
    ready,
    dataContext,
    loadError,
    reload,
  } = useMonkData()
  const { openUpgrade } = useUpgradeOffer()
  const { isPro, isLoading: planLoading, trialExpired } = usePlan()
  const allowFullWeek = true
  const freeAfterTrial = !planLoading && !isPro && trialExpired
  const atTimeboxLimit = freeAfterTrial && data.timeSlots.length >= 1

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
    void savePlannerSlot(dataContext, slot)
    captureEvent('planner_slot_added', {
      category: slot.category,
      time_slot: slot.time,
    })
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
    void Promise.all(slots.map((s) => savePlannerSlot(dataContext, s)))
    captureEvent('planner_slot_added', {
      category: 'template',
      time_slot: 'morning-routine',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {loadError ? (
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 md:pt-2">
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
      ) : (
        <>
          {data.timeSlots.length === 0 ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
              <Card className="p-4">
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
            </div>
          ) : null}
          <WeeklyPlannerApp
            data={data}
            onChange={setData}
            dataContext={dataContext}
            allowFullWeek={allowFullWeek}
          />
        </>
      )}
    </div>
  )
}
