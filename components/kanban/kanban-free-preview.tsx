'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { KanbanCard } from '@/types/kanban'

const PREVIEW_COLS = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

const SAMPLE: Record<string, KanbanCard[]> = {
  todo: [
    {
      id: 'p1',
      columnId: 'todo',
      title: 'Draft project brief',
      notes: '',
      priority: 'high',
      category: 'Work',
      categoryColour: 'bg-blue-500',
      dueDate: null,
      goalId: null,
      order: 0,
      createdAt: '',
    },
    {
      id: 'p2',
      columnId: 'todo',
      title: 'Review analytics',
      notes: '',
      priority: 'medium',
      category: 'Study',
      categoryColour: 'bg-yellow-500',
      dueDate: null,
      goalId: 'sample-goal',
      order: 1,
      createdAt: '',
    },
  ],
  inprogress: [
    {
      id: 'p3',
      columnId: 'inprogress',
      title: 'Build Kanban board',
      notes: '',
      priority: 'high',
      category: 'Work',
      categoryColour: 'bg-blue-500',
      dueDate: null,
      goalId: null,
      order: 0,
      createdAt: '',
    },
  ],
  done: [
    {
      id: 'p4',
      columnId: 'done',
      title: 'Ship v1',
      notes: '',
      priority: 'low',
      category: 'Personal',
      categoryColour: 'bg-green-500',
      dueDate: null,
      goalId: null,
      order: 0,
      createdAt: '',
    },
  ],
}

function priorityBorder(p: KanbanCard['priority']) {
  if (p === 'high') return 'border-l-red-500'
  if (p === 'low') return 'border-l-green-500'
  return 'border-l-amber-500'
}

export function KanbanFreePreview() {
  return (
    <div className="relative min-h-[420px]">
      <div
        className="pointer-events-none select-none opacity-90"
        style={{ filter: 'blur(4px)' }}
        aria-hidden
      >
        <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
          {PREVIEW_COLS.map((col) => (
            <Card
              key={col.id}
              className="flex w-full shrink-0 flex-col border-border bg-secondary/30 p-3 md:min-w-[280px] md:max-w-[320px]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{col.title}</span>
                <span className="rounded-full bg-[#F59E0B]/25 px-2 py-0.5 text-xs font-medium text-[#F59E0B]">
                  {SAMPLE[col.id]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(SAMPLE[col.id] ?? []).map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-md border border-border/80 border-l-4 bg-card/80 p-3 text-left ${priorityBorder(c.priority)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-bold text-white">{c.title}</p>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${c.categoryColour}`}
                      />
                    </div>
                    {c.goalId ? (
                      <p className="mt-1 text-xs opacity-80">🎯 Linked goal</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="max-w-md border-border bg-background/95 p-8 text-center shadow-xl backdrop-blur-sm">
          <p className="text-2xl" aria-hidden>
            📋
          </p>
          <h2 className="mt-2 text-xl font-semibold">Kanban Board</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Visualise your work. Drag tasks from To Do to Done. Linked to your
            daily goals.
          </p>
          <p className="mt-4 text-sm font-medium">Unlock Kanban with Pro</p>
          <Button className="mt-4 bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90" asChild>
            <Link href="/upgrade">Upgrade to Pro →</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
