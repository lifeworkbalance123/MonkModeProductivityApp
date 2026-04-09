'use client'

import { useRef, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { FREE_HABIT_LIMIT } from '@/lib/plan-limits'
import { DEFAULT_STARTER_HABIT_NAMES } from '@/lib/default-habits'
import { deleteHabit, newHabitClientId, saveHabit } from '@/lib/dataService'
import { captureEvent } from '@/lib/analytics'

export default function HabitsPage() {
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
  const { isPro, isLoading: planLoading } = usePlan()
  const [draft, setDraft] = useState('')

  const atHabitLimit =
    !planLoading && !isPro && data.habits.length >= FREE_HABIT_LIMIT

  async function addHabit() {
    const name = draft.trim()
    if (!name) return
    if (!planLoading && !isPro && data.habits.length >= FREE_HABIT_LIMIT) return
    const habit = { id: newHabitClientId(dataContext), name, icon: '' }
    setData({
      ...data,
      habits: [...data.habits, habit],
    })
    const { error } = await saveHabit(dataContext, habit)
    if (error) {
      showToast("Couldn't save changes. Please try again.", 'error')
    } else {
      captureEvent('habit_added')
    }
    setDraft('')
  }

  function addDefaultHabits() {
    const next = DEFAULT_STARTER_HABIT_NAMES.map((name) => ({
      id: newHabitClientId(dataContext),
      name,
      icon: '',
    }))
    setData({
      ...data,
      habits: [...data.habits, ...next],
    })
    void Promise.all(
      next.map((h) =>
        saveHabit(dataContext, h).then((r) => {
          if (r.error) {
            showToast("Couldn't save changes. Please try again.", 'error')
          } else {
            captureEvent('habit_added')
          }
        }),
      ),
    )
  }

  function removeHabit(id: string) {
    const habitLog = { ...data.habitLog }
    delete habitLog[id]
    setData({
      ...data,
      habits: data.habits.filter((h) => h.id !== id),
      habitLog,
    })
    void deleteHabit(dataContext, id)
  }

  function renameHabit(id: string, name: string) {
    setData({
      ...data,
      habits: data.habits.map((h) => (h.id === id ? { ...h, name } : h)),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {loadError ? (
        <div className="max-w-xl mx-auto px-4 pt-20 pb-2">
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
        <div>
          <h1 className="text-2xl font-semibold">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Manage the habits shown on your dashboard and weekly planner.
          </p>
          {atHabitLimit ? (
            <div
              role="status"
              className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground"
            >
              You&apos;ve reached the Free limit of {FREE_HABIT_LIMIT} habits.
              Upgrade to Pro for unlimited habits.{' '}
              <button
                type="button"
                className="font-medium text-accent hover:underline"
                onClick={() =>
                  openUpgrade({
                    featureContext:
                      'Free plan includes up to 3 habits. Upgrade for unlimited habits and full planner access.',
                  })
                }
              >
                Upgrade
              </button>
            </div>
          ) : null}
        </div>
        <Card className="p-4 space-y-3">
          {data.habits.length === 0 ? (
            <EmptyState
              icon="✅"
              heading="No habits yet"
              subtext="Start small. Even one habit done daily builds unstoppable momentum."
              ctaLabel="Add your first habit"
              ctaAction={() => inputRef.current?.focus()}
              secondaryLabel="Use default habits"
              secondaryAction={addDefaultHabits}
              className="min-h-[240px]"
            />
          ) : null}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New habit name"
              className="flex-1"
              disabled={atHabitLimit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void addHabit()
                }
              }}
            />
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={() => void addHabit()}
              disabled={atHabitLimit}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {data.habits.length > 0 ? (
            <ul className="space-y-2">
              {data.habits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-2 border border-border rounded-lg p-2"
                >
                  <Input
                    value={h.name}
                    onChange={(e) => renameHabit(h.id, e.target.value)}
                    className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeHabit(h.id)}
                    aria-label={`Remove ${h.name}`}
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
