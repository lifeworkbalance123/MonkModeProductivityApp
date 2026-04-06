'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { ProBadge } from '@/components/pro-badge'
import { UpgradeModal } from '@/components/upgrade-modal'
import { usePlan } from '@/hooks/usePlan'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  const { isPro, isLoading: planLoading } = usePlan()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Habit streaks, completion trends, and reports.
          </p>
        </div>

        <div className="relative">
          <Card className="p-8 border-border opacity-40 pointer-events-none">
            <div className="flex items-center gap-3 text-muted-foreground">
              <BarChart3 className="w-10 h-10" />
              <div>
                <p className="font-medium text-foreground">Overview</p>
                <p className="text-sm">Weekly completion rate and habit heatmap</p>
              </div>
            </div>
            <div className="mt-6 h-40 rounded-lg bg-secondary/40 border border-border/60" />
          </Card>
          {!planLoading && !isPro ? (
            <button
              type="button"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/75 backdrop-blur-[2px]"
              onClick={() => setUpgradeOpen(true)}
            >
              <ProBadge className="scale-110" />
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Analytics is Pro — track streaks and trends over time.
              </p>
              <span className="text-xs font-medium text-accent">Tap to upgrade</span>
            </button>
          ) : null}
        </div>

        {!planLoading && isPro ? (
          <p className="text-sm text-muted-foreground">
            Detailed charts will appear here in a future release.{' '}
            <Link href="/dashboard" className="text-accent hover:underline">
              Dashboard
            </Link>
          </p>
        ) : null}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        description="Track streaks, completion rates, and trends to understand how your habits compound."
      />
    </div>
  )
}
