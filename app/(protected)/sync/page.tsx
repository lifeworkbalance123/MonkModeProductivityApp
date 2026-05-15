'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BonusBadge } from '@/components/bonus-badge'
import { ProBadge } from '@/components/pro-badge'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { usePlan } from '@/hooks/usePlan'
import { Cloud } from 'lucide-react'
import { Tooltip } from '@/components/ui/first-visit-tooltip'
import { TOOLTIP_CLOUD_SYNC } from '@/lib/tool-library-tooltips'

export default function CloudSyncPage() {
  const { openUpgrade } = useUpgradeOffer()
  const { isPro, isLoading: planLoading } = usePlan()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Tooltip
          id="tooltip_sync"
          text={TOOLTIP_CLOUD_SYNC}
        >
          <div>
            <h1 className="text-2xl font-semibold">Cloud sync</h1>
            <p className="text-sm text-muted-foreground">
              Back up and sync monkcubed data across your devices.
            </p>
          </div>
        </Tooltip>

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
              onClick={() =>
                openUpgrade({
                  featureContext:
                    'Keep your monkcubed data backed up and in sync across devices with cloud storage.',
                })
              }
            >
              <BonusBadge className="scale-110" />
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Cloud sync is a Bonus feature (included with Pro) — provided as-is, best effort.
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

    </div>
  )
}
