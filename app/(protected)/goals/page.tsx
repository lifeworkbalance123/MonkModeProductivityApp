'use client'

import { useEffect, useRef, useState } from 'react'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { FREE_GOAL_LIMIT } from '@/lib/plan-limits'
import {
  deleteGoal,
  newGoalClientId,
  saveGoal,
  toggleGoalComplete,
} from '@/lib/dataService'
import { captureEvent } from '@/lib/analytics'
import {
  KANBAN_GOAL_COMPLETED_EVENT,
  type KanbanGoalCompletedDetail,
} from '@/lib/kanban-events'
import { recordTodayGoalSnapshot } from '@/lib/goal-daily-snapshots'
import OneBigTask from '@/components/program/OneBigTask'
import { Tooltip } from '@/components/ui/first-visit-tooltip'
import { TOOLTIP_GOALS } from '@/lib/tool-library-tooltips'

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

export default function GoalsPage() {
  const { openUpgrade } = useUpgradeOffer()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    data,
    setData,
    ready,
    dataContext,
    loadError,
    reload,
  } = useMonkData()
  const { isPro, isLoading: planLoading, trialExpired } = usePlan()
  const [draft, setDraft] = useState('')

  const freeGoalCap = !planLoading && !isPro && trialExpired ? 1 : FREE_GOAL_LIMIT
  const atGoalLimit = !planLoading && !isPro && data.goals.length >= freeGoalCap

  useEffect(() => {
    if (!ready) return
    recordTodayGoalSnapshot(data.goals)
  }, [ready, data.goals])

  async function addGoal() {
    const text = draft.trim()
    if (!text) return
    if (!planLoading && !isPro && data.goals.length >= freeGoalCap) {
      openUpgrade({
        featureContext:
          'Free plan (after trial) includes 1 daily goal. Upgrade for unlimited goals and analytics.',
      })
      return
    }
    const goal = { id: newGoalClientId(dataContext), text, completed: false }
    setData({
      ...data,
      goals: [...data.goals, goal],
    })
    const { error } = await saveGoal(dataContext, goal)
    if (error) {
      showToast("Couldn't save changes. Please try again.", 'error')
    } else {
      captureEvent('goal_added', { goal_type: 'daily' })
    }
    setDraft('')
  }

  function removeGoal(id: string) {
    setData({
      ...data,
      goals: data.goals.filter((g) => g.id !== id),
    })
    void deleteGoal(dataContext, id)
  }

  function setText(id: string, text: string) {
    setData({
      ...data,
      goals: data.goals.map((g) => (g.id === id ? { ...g, text } : g)),
    })
  }

  function toggle(id: string) {
    const goals = data.goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g,
    )
    const updated = goals.find((g) => g.id === id)
    setData({
      ...data,
      goals,
    })
    if (updated) {
      void (async () => {
        const r = await toggleGoalComplete(dataContext, updated)
        if (r.error) {
          showToast("Couldn't save changes. Please try again.", 'error')
        } else if (updated.completed) {
          captureEvent('goal_completed')
          window.dispatchEvent(
            new CustomEvent<KanbanGoalCompletedDetail>(
              KANBAN_GOAL_COMPLETED_EVENT,
              { detail: { goalId: id } },
            ),
          )
        }
      })()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {loadError ? (
        <div className="max-w-xl mx-auto px-4 pt-4 pb-2 md:pt-2">
          <ErrorBanner
            message={loadError}
            onRetry={() => void reload()}
          />
        </div>
      ) : null}
      {!ready ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Loading data</span>
        </div>
      ) : null}
      {ready ? (
      <div className="max-w-xl mx-auto px-4 py-8 pt-24 space-y-6">
        <OneBigTask />
        <Tooltip
          id="tooltip_goals"
          text={TOOLTIP_GOALS}
        >
          <div>
            <div className="label-machine">System</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Goals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily priorities shown on the dashboard (checkbox syncs both places).
            </p>
            {atGoalLimit ? (
              <div
                role="status"
                className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-none"
              >
                You&apos;ve reached the Free limit of {freeGoalCap} goal{freeGoalCap === 1 ? '' : 's'}.
                Upgrade to Pro for unlimited goals.{' '}
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() =>
                    openUpgrade({
                      featureContext:
                        freeGoalCap === 1
                          ? 'Free plan (after trial) includes 1 daily goal. Upgrade for unlimited goals and analytics.'
                          : `Free plan includes up to ${FREE_GOAL_LIMIT} daily goals. Upgrade for unlimited goals and analytics.`,
                    })
                  }
                >
                  Upgrade
                </button>
              </div>
            ) : null}
          </div>
        </Tooltip>
        <Card className="p-4 space-y-3">
          {data.goals.length === 0 ? (
            <EmptyState
              icon="🎯"
              heading="No goals for today"
              subtext="Name one outcome for today — then break bigger 30–60 day goals into steps on this page."
              ctaLabel="Set today&apos;s first goal"
              ctaAction={() => inputRef.current?.focus()}
              className="min-h-[240px]"
            />
          ) : null}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New goal"
              className="flex-1"
              disabled={atGoalLimit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void addGoal()
                }
              }}
            />
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={() => void addGoal()}
              disabled={atGoalLimit}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {data.goals.length > 0 ? (
          <ul className="space-y-2">
            {data.goals.map((g) => (
              <li
                key={g.id}
                className="flex items-start gap-2 border border-border rounded-lg p-2"
              >
                <Checkbox
                  checked={g.completed}
                  onCheckedChange={() => toggle(g.id)}
                  className={`mt-2 ${checkClass}`}
                />
                <Input
                  value={g.text}
                  onChange={(e) => setText(g.id, e.target.value)}
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
                  onClick={() => removeGoal(g.id)}
                  aria-label={`Remove goal`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
          ) : null}
        </Card>
      </div>
      ) : null}
    </div>
  )
}
