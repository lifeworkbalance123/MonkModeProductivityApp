'use client'

import { useCallback, useRef, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { FREE_HABIT_LIMIT } from '@/lib/plan-limits'
import { DEFAULT_STARTER_HABIT_NAMES } from '@/lib/default-habits'
import type { Habit } from '@/lib/monk-types'
import { deleteHabit, newHabitClientId, saveHabit } from '@/lib/dataService'
import { captureEvent } from '@/lib/analytics'

const HABIT_EMOJI_OPTIONS = [
  '✅',
  '🔥',
  '💧',
  '📚',
  '🏃',
  '🧘',
  '💤',
  '🥗',
  '💪',
  '🎯',
  '📝',
  '☀️',
  '🌙',
  '🙏',
  '🎵',
  '🧹',
  '💼',
  '🚶',
  '🌱',
  '⭐',
  '❤️',
  '🧠',
  '⏰',
  '🚫',
]

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

  const [editOpen, setEditOpen] = useState(false)
  const [editHabitId, setEditHabitId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

  const openEdit = useCallback((h: Habit) => {
    setEditHabitId(h.id)
    setEditName(h.name)
    setEditIcon(h.icon ?? '')
    setEditOpen(true)
  }, [])

  const closeEdit = useCallback(() => {
    setEditOpen(false)
    setEditHabitId(null)
    setEditName('')
    setEditIcon('')
    setEditSaving(false)
  }, [])

  async function saveEdit() {
    if (!editHabitId) return
    const name = editName.trim()
    if (!name) {
      showToast('Habit name cannot be empty.', 'error')
      return
    }
    setEditSaving(true)
    const updated: Habit = {
      id: editHabitId,
      name,
      icon: editIcon.trim(),
    }
    setData({
      ...data,
      habits: data.habits.map((h) => (h.id === editHabitId ? updated : h)),
    })
    const { error } = await saveHabit(dataContext, updated)
    setEditSaving(false)
    if (error) {
      showToast("Couldn't save changes. Please try again.", 'error')
    } else {
      captureEvent('habit_updated')
      closeEdit()
    }
  }

  const moveHabit = useCallback(
    (id: string, delta: -1 | 1) => {
      const i = data.habits.findIndex((h) => h.id === id)
      const j = i + delta
      if (i < 0 || j < 0 || j >= data.habits.length) return
      const habits = [...data.habits]
      ;[habits[i], habits[j]] = [habits[j], habits[i]]
      setData({ ...data, habits })
    },
    [data],
  )

  const deleteTargetName =
    deleteConfirmId != null
      ? (data.habits.find((h) => h.id === deleteConfirmId)?.name ?? 'this habit')
      : ''

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
              {data.habits.map((h, index) => (
                <li key={h.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-2 border border-border rounded-lg p-2 select-none">
                        <span
                          className="text-lg w-8 text-center shrink-0"
                          aria-hidden
                        >
                          {h.icon?.trim() ? h.icon : '·'}
                        </span>
                        <span className="flex-1 text-sm truncate px-1">
                          {h.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground shrink-0 h-8 w-8"
                          aria-label={`Edit ${h.name}`}
                          onClick={() => openEdit(h)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                          onClick={() => removeHabit(h.id)}
                          aria-label={`Remove ${h.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onSelect={() => openEdit(h)}>
                        Edit
                      </ContextMenuItem>
                      <ContextMenuItem
                        onSelect={() => setDeleteConfirmId(h.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete…
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        disabled={index === 0}
                        onSelect={() => moveHabit(h.id, -1)}
                      >
                        Move up
                      </ContextMenuItem>
                      <ContextMenuItem
                        disabled={index >= data.habits.length - 1}
                        onSelect={() => moveHabit(h.id, 1)}
                      >
                        Move down
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
      ) : null}

      <Dialog open={editOpen} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription>
              Update the name and optional emoji shown with this habit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="habit-edit-name">Habit name</Label>
              <Input
                id="habit-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Habit name"
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium leading-none">
                Icon / emoji
              </span>
              <p className="text-xs text-muted-foreground">
                Tap one to set, or leave empty.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                <Button
                  type="button"
                  variant={editIcon.trim() === '' ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() => setEditIcon('')}
                >
                  None
                </Button>
                {HABIT_EMOJI_OPTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={editIcon === emoji ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-9 w-9 p-0 text-lg"
                    aria-label={`Use ${emoji}`}
                    onClick={() => setEditIcon(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeEdit}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={editSaving}
              onClick={() => void saveEdit()}
            >
              {editSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{deleteTargetName}&quot; from your list. Completion
              history for this habit will be cleared from this device view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) removeHabit(deleteConfirmId)
                setDeleteConfirmId(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
