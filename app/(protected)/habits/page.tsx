'use client'

import { useCallback, useRef, useState } from 'react'
import { format, startOfWeek } from 'date-fns'
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
import { Loader2, Pencil, Plus, Smile, Trash2 } from 'lucide-react'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { FREE_HABIT_LIMIT } from '@/lib/plan-limits'
import { DEFAULT_STARTER_HABIT_NAMES } from '@/lib/default-habits'
import type { Habit } from '@/lib/monk-types'
import { deleteHabit, newHabitClientId, saveHabit } from '@/lib/dataService'
import { captureEvent } from '@/lib/analytics'
import {
  HABIT_EMOJI_OPTIONS,
  HABIT_ICON_PICKER_LIBRARY,
  getHabitDisplayIcon,
  suggestHabitIconFromName,
} from '@/lib/habit-icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/first-visit-tooltip'
import { TOOLTIP_HABITS } from '@/lib/tool-library-tooltips'
import { cn } from '@/lib/utils'
import { habitWeekDayCompletion } from '@/lib/monk-streak'

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

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
  const { isPro, isLoading: planLoading, trialExpired } = usePlan()
  const [draft, setDraft] = useState('')
  const [draftIcon, setDraftIcon] = useState('')
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editHabitId, setEditHabitId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const freeHabitCap = !planLoading && !isPro && trialExpired ? 1 : FREE_HABIT_LIMIT
  const atHabitLimit = !planLoading && !isPro && data.habits.length >= freeHabitCap
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  async function addHabit() {
    const name = draft.trim()
    if (!name) return
    if (!planLoading && !isPro && data.habits.length >= freeHabitCap) {
      openUpgrade({
        featureContext:
          'Free plan (after trial) includes 1 active habit. Upgrade for unlimited habits.',
      })
      return
    }
    const icon =
      draftIcon.trim() || suggestHabitIconFromName(name) || ''
    const habit = { id: newHabitClientId(dataContext), name, icon }
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
    setDraftIcon('')
  }

  function addDefaultHabits() {
    if (!planLoading && !isPro && data.habits.length >= freeHabitCap) {
      openUpgrade({
        featureContext:
          'Free plan (after trial) includes 1 active habit. Upgrade for unlimited habits.',
      })
      return
    }
    const existingNames = new Set(
      data.habits.map((h) => h.name.trim().toLowerCase()),
    )
    const starterNames = DEFAULT_STARTER_HABIT_NAMES.filter(
      (name) => !existingNames.has(name.trim().toLowerCase()),
    )
    const next = starterNames.map((name, i) => ({
      id: newHabitClientId(dataContext),
      name,
      icon:
        suggestHabitIconFromName(name) ??
        HABIT_ICON_PICKER_LIBRARY[i % HABIT_ICON_PICKER_LIBRARY.length] ??
        '',
    }))
    const room = Math.max(0, freeHabitCap - data.habits.length)
    const picked = !planLoading && !isPro ? next.slice(0, room) : next
    if (picked.length === 0) {
      showToast('Those starter habits are already in your list.', 'info')
      return
    }
    setData({ ...data, habits: [...data.habits, ...picked] })
    void Promise.all(
      picked.map((h) =>
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
    const stored = (h.icon ?? '').trim()
    setEditIcon(stored || suggestHabitIconFromName(h.name) || '')
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
        <Tooltip
          id="tooltip_habits"
          text={TOOLTIP_HABITS}
        >
          <div>
            <div className="label-machine">System</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Habits</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the habits shown on your dashboard and weekly planner.
            </p>
            {atHabitLimit ? (
            <div
              role="status"
              className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-none"
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
        </Tooltip>
        <Card className="p-4 space-y-3">
          {data.habits.length === 0 ? (
            <EmptyState
              icon="🌱"
              heading="No habits yet"
              subtext="Start with lemon water, make bed, or phone away — small anchors you can tick every day."
              ctaLabel="Add your first habit"
              ctaAction={() => inputRef.current?.focus()}
              secondaryLabel="Use default habits"
              secondaryAction={addDefaultHabits}
              className="min-h-[240px]"
            />
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-11 shrink-0 border-border px-0 text-xl sm:h-auto"
                  disabled={atHabitLimit}
                  aria-label={draftIcon ? `Icon: ${draftIcon}` : 'Choose habit icon'}
                  title="Choose icon"
                >
                  {draftIcon ? (
                    <span aria-hidden>{draftIcon}</span>
                  ) : (
                    <Smile className="h-5 w-5 text-muted-foreground" aria-hidden />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(100vw-2rem,20rem)] p-3" align="start">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Choose an icon (optional)
                </p>
                <div className="mb-2 flex flex-wrap gap-1">
                  {HABIT_ICON_PICKER_LIBRARY.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={draftIcon === emoji ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-9 w-9 p-0 text-lg"
                      aria-label={`Use ${emoji}`}
                      onClick={() => {
                        setDraftIcon(emoji)
                        setIconPickerOpen(false)
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-xs text-muted-foreground"
                  onClick={() => {
                    setDraftIcon('')
                    setIconPickerOpen(false)
                  }}
                >
                  No icon
                </Button>
              </PopoverContent>
            </Popover>
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New habit name"
              className="min-w-0 flex-1"
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
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 sm:w-11"
              onClick={() => void addHabit()}
              disabled={atHabitLimit}
              aria-label="Add habit"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap the smile to pick an icon before adding (optional). More icons appear in Edit.
          </p>
          {data.habits.length > 0 ? (
            <ul className="space-y-2">
              {data.habits.map((h, index) => {
                const displayIcon = getHabitDisplayIcon(h)
                const dots = habitWeekDayCompletion(data.habitLog, h.id, weekStart)
                const completedCount = dots.filter(Boolean).length
                return (
                <li key={h.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-3 border border-border rounded-md p-3 select-none bg-card">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-lg leading-none bg-secondary rounded-md" aria-hidden>
                          {displayIcon ? (
                            displayIcon
                          ) : (
                            <Smile className="h-5 w-5 text-muted-foreground opacity-60" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium truncate">
                              {h.name}
                            </span>
                            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                              {completedCount}/7
                            </span>
                          </div>
                          <div
                            className="mt-2 flex gap-1.5"
                            role="list"
                            aria-label={`${h.name} completions this week`}
                          >
                            {dots.map((done, i) => (
                              <span
                                key={i}
                                role="listitem"
                                title={`${DAYS_SHORT[i]}: ${done ? 'done' : 'not done'}`}
                                className={cn(
                                  'size-3 shrink-0 rounded-full border-2',
                                  done
                                    ? 'border-[#F5C518] bg-[#F5C518]'
                                    : 'border-muted-foreground/50 bg-background',
                                )}
                              />
                            ))}
                          </div>
                        </div>
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
                )
              })}
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
                Tap one to set, or choose None. Quick picks match the add-habit library.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick picks</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant={editIcon.trim() === '' ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-9 px-2 text-xs"
                    onClick={() => setEditIcon('')}
                  >
                    None
                  </Button>
                  {HABIT_ICON_PICKER_LIBRARY.map((emoji) => (
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
                <p className="text-xs font-medium text-muted-foreground pt-1">More</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {HABIT_EMOJI_OPTIONS.filter(
                    (e) => !(HABIT_ICON_PICKER_LIBRARY as readonly string[]).includes(e),
                  ).map((emoji) => (
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
