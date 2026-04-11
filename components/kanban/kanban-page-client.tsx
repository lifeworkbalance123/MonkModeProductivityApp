'use client'

import { Navigation } from '@/components/navigation'
import { ErrorBanner } from '@/components/ErrorBanner'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { KanbanFreePreview } from '@/components/kanban/kanban-free-preview'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { Loader2 } from 'lucide-react'

export function KanbanPageClient() {
  const { data, setData, ready, loadError, reload } = useMonkData()
  const { isPro, isLoading: planLoading } = usePlan()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {loadError ? (
        <div className="mx-auto max-w-xl px-4 pb-2 pt-20">
          <ErrorBanner message={loadError} onRetry={() => void reload()} />
        </div>
      ) : null}
      {!ready || planLoading ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Loading</span>
        </div>
      ) : null}
      {ready && !planLoading ? (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 pt-24">
          <div>
            <h1 className="text-2xl font-semibold">Kanban</h1>
            <p className="text-sm text-muted-foreground">
              Drag tasks between columns, link them to daily goals, and stay
              focused.
            </p>
          </div>
          {!isPro ? (
            <KanbanFreePreview />
          ) : (
            <KanbanBoard data={data} setData={setData} />
          )}
        </div>
      ) : null}
    </div>
  )
}
