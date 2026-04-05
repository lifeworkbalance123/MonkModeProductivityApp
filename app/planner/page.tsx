'use client'

import { Navigation } from '@/components/navigation'
import { WeeklyPlannerApp } from '@/components/weekly-planner-app'
import { useMonkData } from '@/hooks/use-monk-data'

export default function PlannerPage() {
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
      <WeeklyPlannerApp data={data} onChange={setData} />
    </div>
  )
}
