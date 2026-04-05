'use client'

import { Navigation } from '@/components/navigation'
import { DashboardApp } from '@/components/dashboard-app'
import { useMonkData } from '@/hooks/use-monk-data'

export default function DashboardPage() {
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
      <DashboardApp data={data} onChange={setData} />
    </div>
  )
}
