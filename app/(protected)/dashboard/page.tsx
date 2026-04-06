'use client'

import { Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { DashboardApp } from '@/components/dashboard-app'
import { useMonkData } from '@/hooks/use-monk-data'

export default function DashboardPage() {
  const { data, setData, ready, dataContext } = useMonkData()

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
        <DashboardApp
          data={data}
          onChange={setData}
          dataContext={dataContext}
        />
      )}
    </div>
  )
}
