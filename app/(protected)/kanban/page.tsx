'use client'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { ProBadge } from '@/components/pro-badge'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

export default function KanbanPage() {
  const { openUpgrade } = useUpgradeOffer()
  const { isPro, isLoading: planLoading } = usePlan()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Kanban board</h1>
          <p className="text-sm text-muted-foreground">
            Visualize work across columns — Pro unlocks editing and sync.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3 min-h-[280px]">
          {['To do', 'Doing', 'Done'].map((col) => (
            <Card
              key={col}
              className="p-4 border-dashed border-border bg-secondary/20"
            >
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {col}
              </p>
              <div className="h-24 rounded-md border border-border/60 bg-background/40" />
            </Card>
          ))}
          {!planLoading && !isPro ? (
            <button
              type="button"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/75 backdrop-blur-[2px]"
              onClick={() =>
                openUpgrade({
                  featureContext:
                    'Organize your tasks on a drag-and-drop board so you can see workflow at a glance.',
                })
              }
            >
              <ProBadge className="scale-110" />
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Kanban is a Pro feature — organize tasks on a shared board.
              </p>
              <span className="text-xs font-medium text-accent">Tap to upgrade</span>
            </button>
          ) : null}
        </div>

        {!planLoading && isPro ? (
          <p className="text-sm text-muted-foreground">
            Board editing will connect here in a future release.{' '}
            <Link href="/dashboard" className="text-accent hover:underline">
              Dashboard
            </Link>
          </p>
        ) : null}
      </div>

    </div>
  )
}
