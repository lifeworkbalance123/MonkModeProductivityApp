'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'
import { useMonkData } from '@/hooks/use-monk-data'

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

function newId() {
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function GoalsPage() {
  const { data, setData, ready } = useMonkData()
  const [draft, setDraft] = useState('')

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  function addGoal() {
    const text = draft.trim()
    if (!text) return
    setData({
      ...data,
      goals: [...data.goals, { id: newId(), text, completed: false }],
    })
    setDraft('')
  }

  function removeGoal(id: string) {
    setData({
      ...data,
      goals: data.goals.filter((g) => g.id !== id),
    })
  }

  function setText(id: string, text: string) {
    setData({
      ...data,
      goals: data.goals.map((g) => (g.id === id ? { ...g, text } : g)),
    })
  }

  function toggle(id: string) {
    setData({
      ...data,
      goals: data.goals.map((g) =>
        g.id === id ? { ...g, completed: !g.completed } : g,
      ),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-xl mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Daily priorities shown on the dashboard (checkbox syncs both places).
          </p>
        </div>
        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New goal"
              className="flex-1"
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
    </div>
  )
}
