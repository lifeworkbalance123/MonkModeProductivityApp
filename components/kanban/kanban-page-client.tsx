'use client'

import { ErrorBanner } from '@/components/ErrorBanner'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { KanbanFreePreview } from '@/components/kanban/kanban-free-preview'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { Loader2 } from 'lucide-react'
import { Tooltip } from '@/components/ui/first-visit-tooltip'

export function KanbanPageClient() {
  const { data, setData, ready, loadError, reload } = useMonkData()
  const { isPro, isLoading: planLoading } = usePlan()

  if (process.env.NODE_ENV === 'development') {
    console.log('Kanban render — isPro:', isPro)
    console.log('Kanban render — isLoading:', planLoading)
    console.log('Kanban render — ready:', ready)
  }

  return (
    <div className="min-h-screen bg-background">
      {loadError ? (
        <div className="mx-auto max-w-xl px-4 pb-2 pt-4 md:pt-2">
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
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 pt-4 md:pt-2">
          <Tooltip
            id="tooltip_kanban"
            text="Turn your One Big Task into small steps. Drag cards from To Do → Doing → Done. Great for projects."
          >
            <div>
              <h1 className="text-2xl font-semibold">Kanban</h1>
              <p className="text-sm text-muted-foreground">
                Drag tasks between columns, link them to daily goals, and stay
                focused.
              </p>
            </div>
          </Tooltip>
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
