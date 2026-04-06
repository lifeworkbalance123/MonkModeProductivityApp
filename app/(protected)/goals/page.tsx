'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

export default function GoalsPage() {
  const { data, setData, ready, dataContext } = useMonkData()
  const { isPro, isLoading: planLoading } = usePlan()
  const [draft, setDraft] = useState('')

  const atGoalLimit =
    !planLoading && !isPro && data.goals.length >= FREE_GOAL_LIMIT

  function addGoal() {
    const text = draft.trim()
    if (!text) return
    if (!planLoading && !isPro && data.goals.length >= FREE_GOAL_LIMIT) return
    const goal = { id: newGoalClientId(dataContext), text, completed: false }
    setData({
      ...data,
      goals: [...data.goals, goal],
    })
    void saveGoal(dataContext, goal)
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
    if (updated) void toggleGoalComplete(dataContext, updated)
  }

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
      ) : null}
      {ready ? (
      <div className="max-w-xl mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Daily priorities shown on the dashboard (checkbox syncs both places).
          </p>
          {atGoalLimit ? (
            <div
              role="status"
              className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground"
            >
              You&apos;ve reached the Free limit of {FREE_GOAL_LIMIT} goals.
              Upgrade to Pro for unlimited goals.{' '}
              <Link
                href="/pricing"
                className="font-medium text-accent hover:underline"
              >
                Upgrade
              </Link>
            </div>
          ) : null}
        </div>
        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New goal"
              className="flex-1"
              disabled={atGoalLimit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addGoal()
                }
              }}
            />
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={addGoal}
              disabled={atGoalLimit}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
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
        </Card>
      </div>
      ) : null}
    </div>
  )
}
