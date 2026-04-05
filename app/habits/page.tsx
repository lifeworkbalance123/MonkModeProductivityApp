'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { useMonkData } from '@/hooks/use-monk-data'

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function HabitsPage() {
  const { data, setData, ready } = useMonkData()
  const [draft, setDraft] = useState('')

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  function addHabit() {
    const name = draft.trim()
    if (!name) return
    setData({
      ...data,
      habits: [...data.habits, { id: newId('h'), name }],
    })
    setDraft('')
  }

  function removeHabit(id: string) {
    const habitLog = { ...data.habitLog }
    delete habitLog[id]
    setData({
      ...data,
      habits: data.habits.filter((h) => h.id !== id),
      habitLog,
    })
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
      <div className="max-w-xl mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Manage the habits shown on your dashboard and weekly planner.
          </p>
        </div>
        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New habit name"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addHabit()
                }
              }}
            />
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={addHabit}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
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
        </Card>
      </div>
    </div>
  )
}
