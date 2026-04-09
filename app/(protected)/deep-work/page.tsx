'use client'

import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { ProBadge } from '@/components/pro-badge'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { usePlan } from '@/hooks/usePlan'
import { Timer } from 'lucide-react'

export default function DeepWorkPage() {
  const { openUpgrade } = useUpgradeOffer()
  const { isPro, isLoading: planLoading } = usePlan()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Deep Work</h1>
          <p className="text-sm text-muted-foreground">
            Timed focus sessions with guardrails against distraction.
          </p>
        </div>

        <div className="relative">
          <Card className="p-8 border-border opacity-40 pointer-events-none text-center">
            <Timer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Session timer</p>
            <p className="text-3xl font-mono font-semibold mt-2 tabular-nums">
              25:00
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Start / pause controls will live here
            </p>
          </Card>
          {!planLoading && !isPro ? (
            <button
              type="button"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/75 backdrop-blur-[2px]"
              onClick={() =>
                openUpgrade({
                  featureContext:
                    'Structured focus sessions with timers and guardrails to protect uninterrupted deep work.',
                })
              }
            >
              <ProBadge className="scale-110" />
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Deep Work mode is Pro — structured sessions for uninterrupted
                focus.
              </p>
              <span className="text-xs font-medium text-accent">Tap to upgrade</span>
            </button>
          ) : null}
        </div>

        {!planLoading && isPro ? (
          <p className="text-sm text-muted-foreground text-center">
            Timer logic ships in a future update.{' '}
            <Link href="/dashboard" className="text-accent hover:underline">
              Dashboard
            </Link>
          </p>
        ) : null}
      </div>

    </div>
  )
}
