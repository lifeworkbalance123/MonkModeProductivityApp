'use client'

import { Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { WeeklyPlannerApp } from '@/components/weekly-planner-app'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'

export default function PlannerPage() {
  const { data, setData, ready, dataContext } = useMonkData()
  const { isPro, isLoading: planLoading } = usePlan()
  const allowFullWeek = !planLoading && isPro

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {!ready ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Loading data</span>
        </div>
      ) : (
        <WeeklyPlannerApp
          data={data}
          onChange={setData}
          dataContext={dataContext}
          allowFullWeek={allowFullWeek}
        />
      )}
    </div>
  )
}
