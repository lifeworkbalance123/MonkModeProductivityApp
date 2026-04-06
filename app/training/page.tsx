'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProBadge } from '@/components/pro-badge'
import { UpgradeModal } from '@/components/upgrade-modal'
import { usePlan } from '@/hooks/usePlan'
import { FREE_TRAINING_MODULE_SLOTS } from '@/lib/plan-limits'
import { Lock } from 'lucide-react'

const MODULES = [
  {
    id: '1',
    title: 'Habit stacking essentials',
    blurb: 'Chain small wins into routines that stick without relying on willpower alone.',
    duration: '10 min',
  },
  {
    id: '2',
    title: 'Morning focus ritual',
    blurb: 'Design a repeatable start so your first hour supports deep work.',
    duration: '8 min',
  },
  {
    id: '3',
    title: 'Attention recovery',
    blurb: 'Bounce back from distraction and protect your cognitive momentum.',
    duration: '14 min',
  },
  {
    id: '4',
    title: 'Weekly review mastery',
    blurb: 'Close loops, spot patterns, and set direction for the week ahead.',
    duration: '18 min',
  },
] as const

export default function TrainingPage() {
  const { isPro, isLoading: planLoading } = usePlan()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const isLockedIndex = (index: number) =>
    index >= FREE_TRAINING_MODULE_SLOTS && (planLoading || !isPro)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8 pt-24 space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Training</h1>
          <p className="text-sm text-muted-foreground">
            Guided modules — first {FREE_TRAINING_MODULE_SLOTS} are included on
            Free; unlock the full library with Pro.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((mod, index) => {
            const locked = isLockedIndex(index)
            return (
              <Card
                key={mod.id}
                className="relative overflow-hidden p-5 text-left border-border"
              >
                <div className={locked ? 'opacity-50' : ''}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {mod.duration}
                  </p>
                  <h2 className="font-medium text-foreground mb-2">{mod.title}</h2>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {mod.blurb}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    disabled={locked}
                  >
                    Open module
                  </Button>
                </div>
                {locked ? (
                  <button
                    type="button"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-[2px] cursor-pointer"
                    onClick={() => setUpgradeOpen(true)}
                  >
                    <Lock className="w-8 h-8 text-muted-foreground" aria-hidden />
                    <ProBadge />
                    <span className="text-xs text-muted-foreground">
                      Tap to upgrade
                    </span>
                  </button>
                ) : null}
              </Card>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-accent hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        description="Unlock every training module with Pro — structured lessons for habits, focus, and consistency."
      />
    </div>
  )
}
