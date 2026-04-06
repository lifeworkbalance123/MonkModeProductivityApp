'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { ProBadge } from '@/components/pro-badge'
import { UpgradeModal } from '@/components/upgrade-modal'
import { usePlan } from '@/hooks/usePlan'
import { Cloud } from 'lucide-react'

export default function CloudSyncPage() {
  const { isPro, isLoading: planLoading } = usePlan()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Cloud sync</h1>
          <p className="text-sm text-muted-foreground">
            Back up and sync MonkMode data across your devices.
          </p>
        </div>

        <div className="relative">
          <Card className="p-8 border-border opacity-40 pointer-events-none">
            <Cloud className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Sync status</p>
            <p className="text-sm text-muted-foreground mt-1">
              Last backup: — (not configured)
            </p>
          </Card>
          {!planLoading && !isPro ? (
            <button
              type="button"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/75 backdrop-blur-[2px]"
              onClick={() => setUpgradeOpen(true)}
            >
              <ProBadge className="scale-110" />
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Cloud sync is Pro — keep habits and goals backed up everywhere.
              </p>
              <span className="text-xs font-medium text-accent">Tap to upgrade</span>
            </button>
          ) : null}
        </div>

        {!planLoading && isPro ? (
          <p className="text-sm text-muted-foreground">
            Sync providers will connect here in a future release.{' '}
            <Link href="/settings" className="text-accent hover:underline">
              Settings
            </Link>
          </p>
        ) : null}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        description="Keep your MonkMode data backed up and in sync across devices with cloud storage."
      />
    </div>
  )
}
