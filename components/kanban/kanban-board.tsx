'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { useToast } from '@/context/ToastContext'
import { saveGoal } from '@/lib/dataService'
import {
  archiveCards,
  clearColumnCards,
  deleteCard,
  deleteColumn,
  getArchivedCount,
  getCards,
  getColumns,
  getGoalSyncEnabled,
  getLastResetDateLocal,
  moveCard,
  newKanbanCardId,
  newKanbanColumnId,
  saveCard,
  saveColumn,
  setGoalSyncEnabled,
  setLastResetDateLocal,
} from '@/lib/kanbanService'
import {
  KANBAN_GOAL_COMPLETED_EVENT,
  type KanbanGoalCompletedDetail,
} from '@/lib/kanban-events'
import { TIME_SLOT_CATEGORY_OPTIONS } from '@/components/time-schedule-card'
import type { Goal, MonkData } from '@/lib/monk-types'
import type { KanbanCard, KanbanColumn, KanbanPriority } from '@/types/kanban'
import { DEFAULT_KANBAN_COLUMNS } from '@/types/kanban'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils'

const DONE_ID = 'done'
const TODO_ID = 'todo'

type Props = {
  data: MonkData
  setData: (next: MonkData) => void
}

function priorityBorder(p: KanbanPriority) {
  if (p === 'high') return 'border-l-red-500'
  if (p === 'low') return 'border-l-green-500'
  return 'border-l-amber-500'
}

function categoryForLabel(label: string) {
  return (
    TIME_SLOT_CATEGORY_OPTIONS.find((o) => o.label === label) ??
    TIME_SLOT_CATEGORY_OPTIONS[0]
  )
}

export function KanbanBoard({ data, setData }: Props) {
  const ctx = useDataServiceContext()
  const { showToast } = useToast()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [archivedCount, setArchivedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [goalSync, setGoalSyncState] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [filterPriority, setFilterPriority] = useState<
    'all' | KanbanPriority
  >('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editColumnTitle, setEditColumnTitle] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [addColOpen, setAddColOpen] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [cardModal, setCardModal] = useState<KanbanCard | null>(null)
  const [moveModal, setMoveModal] = useState<KanbanCard | null>(null)
  const [moveTargetCol, setMoveTargetCol] = useState('')
  const [clearColId, setClearColId] = useState<string | null>(null)
  const [deleteColId, setDeleteColId] = useState<string | null>(null)
  const [syncTick, setSyncTick] = useState(0)

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  if (process.env.NODE_ENV === 'development') {
    console.log('KanbanBoard render — isPro:', ctx.isPro)
    console.log('KanbanBoard render — loading:', loading)
    console.log('KanbanBoard render — columns:', columns.length)
    console.log('KanbanBoard render — cards:', cards.length)
  }

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [c, k, a] = await Promise.all([
        getColumns(ctx),
        getCards(ctx),
        getArchivedCount(ctx),
      ])
      setColumns(c.length ? c : DEFAULT_KANBAN_COLUMNS)
      setCards(k)
      setArchivedCount(a)
    } finally {
      setLoading(false)
    }
  }, [ctx])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    setGoalSyncState(getGoalSyncEnabled())
  }, [])

  useEffect(() => {
    if (loading) return
    const last = getLastResetDateLocal()
    if (last === todayKey) return
    const inc = cards.filter((c) => c.columnId !== DONE_ID).length
    if (inc > 0) {
      setIncompleteCount(inc)
      setResetOpen(true)
    }
  }, [loading, cards, todayKey])

  useEffect(() => {
    if (loading) return
    if (!getGoalSyncEnabled()) return
    void (async () => {
      const k = await getCards(ctx)
      const incomplete = data.goals.filter((g) => !g.completed)
      let added = 0
      for (const g of incomplete) {
        if (k.some((c) => c.goalId === g.id)) continue
        const cat = categoryForLabel('Work')
        const row: KanbanCard = {
          id: newKanbanCardId(),
          columnId: TODO_ID,
          title: g.text,
          notes: '',
          priority: 'high',
          category: cat.label,
          categoryColour: cat.colorClass,
          dueDate: null,
          goalId: g.id,
          order: k.filter((c) => c.columnId === TODO_ID).length,
          createdAt: new Date().toISOString(),
        }
        const { error } = await saveCard(ctx, row)
        if (!error) {
          k.push(row)
          added += 1
        }
      }
      if (added > 0) await reload()
    })()
  }, [loading, syncTick, ctx, data.goals, reload])

  const markGoalDone = useCallback(
    async (goalId: string) => {
      const g = data.goals.find((x) => x.id === goalId)
      if (!g || g.completed) return
      const updated = { ...g, completed: true }
      setData({
        ...data,
        goals: data.goals.map((x) => (x.id === goalId ? updated : x)),
      })
      const { error } = await saveGoal(ctx, updated)
      if (error) showToast("Couldn't update linked goal.", 'error')
    },
    [ctx, data, setData, showToast],
  )

  const moveLinkedCardToDone = useCallback(
    async (goalId: string) => {
      const current = await getCards(ctx)
      const card = current.find((c) => c.goalId === goalId && c.columnId !== DONE_ID)
      if (!card) return
      const destCards = current
        .filter((c) => c.columnId === DONE_ID && c.id !== card.id)
        .sort((a, b) => a.order - b.order)
      const moved = { ...card, columnId: DONE_ID }
      const newDest = [...destCards, moved].map((c, i) => ({ ...c, order: i }))
      for (const c of newDest) {
        const r = await saveCard(ctx, c)
        if (r.error) {
          showToast(r.error, 'error')
          return
        }
      }
      await reload()
    },
    [ctx, reload, showToast],
  )

  useEffect(() => {
    function onGoalDone(e: Event) {
      const d = (e as CustomEvent<KanbanGoalCompletedDetail>).detail
      if (!d?.goalId) return
      void moveLinkedCardToDone(d.goalId)
    }
    window.addEventListener(KANBAN_GOAL_COMPLETED_EVENT, onGoalDone as EventListener)
    return () =>
      window.removeEventListener(
        KANBAN_GOAL_COMPLETED_EVENT,
        onGoalDone as EventListener,
      )
  }, [moveLinkedCardToDone])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }
    const r = await moveCard(
      ctx,
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index,
    )
    if (r.error) {
      showToast(r.error, 'error')
      return
    }
    const wasDone = destination.droppableId === DONE_ID
    const card = cards.find((c) => c.id === draggableId)
    if (wasDone && card?.goalId) {
      await markGoalDone(card.goalId)
    }
    await reload()
  }

  const visibleColumns = useMemo(() => {
    if (!focusMode) return columns.sort((a, b) => a.order - b.order)
    return columns.filter((c) => c.id === 'inprogress').sort((a, b) => a.order - b.order)
  }, [columns, focusMode])

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (filterPriority !== 'all' && c.priority !== filterPriority) return false
      if (filterCategory !== 'all' && c.category !== filterCategory) return false
      return true
    })
  }, [cards, filterPriority, filterCategory])

  const cardsByColumn = useCallback(
    (colId: string) =>
      filteredCards
        .filter((c) => c.columnId === colId)
        .sort((a, b) => a.order - b.order),
    [filteredCards],
  )

  async function persistColumnTitle(col: KanbanColumn) {
    const t = editColumnTitle.trim()
    if (!t) return
    const next = { ...col, title: t }
    const { error } = await saveColumn(ctx, next)
    if (error) showToast(error, 'error')
    else {
      setColumns((prev) =>
        prev.map((c) => (c.id === col.id ? next : c)).sort((a, b) => a.order - b.order),
      )
    }
    setEditingColumnId(null)
  }

  async function addColumn() {
    const title = newColTitle.trim()
    if (!title) return
    const maxOrder = Math.max(0, ...columns.map((c) => c.order))
    const col: KanbanColumn = {
      id: newKanbanColumnId(),
      title,
      order: maxOrder + 1,
    }
    const { error } = await saveColumn(ctx, col)
    if (error) showToast(error, 'error')
    else setColumns((p) => [...p, col].sort((a, b) => a.order - b.order))
    setNewColTitle('')
    setAddColOpen(false)
  }

  async function handleResetChoice(
    mode: 'keep' | 'tomorrow' | 'archive',
  ) {
    const incomplete = cards.filter((c) => c.columnId !== DONE_ID)
    setResetOpen(false)
    setLastResetDateLocal(todayKey)
    if (mode === 'keep') return
    if (mode === 'archive') {
      const { error } = await archiveCards(ctx, incomplete)
      if (error) showToast(error, 'error')
      await reload()
      return
    }
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    for (const c of incomplete) {
      const u = { ...c, columnId: TODO_ID, dueDate: tomorrow }
      const r = await saveCard(ctx, u)
      if (r.error) showToast(r.error, 'error')
    }
    await reload()
  }

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading board…
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm font-medium">
            Today:{' '}
            <span className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMM d, yyyy')}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Switch
              id="goal-sync"
              checked={goalSync}
              onCheckedChange={(v) => {
                setGoalSyncState(v)
                setGoalSyncEnabled(v)
                setSyncTick((t) => t + 1)
                void reload()
              }}
            />
            <Label htmlFor="goal-sync" className="text-xs font-normal cursor-pointer">
              Sync today&apos;s goals to To Do
            </Label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={filterPriority === p ? 'secondary' : 'outline'}
                className="h-8 text-xs"
                onClick={() => setFilterPriority(p)}
              >
                {p === 'all'
                  ? 'All'
                  : p === 'high'
                    ? '🔴 High'
                    : p === 'medium'
                      ? '🟡 Medium'
                      : '🟢 Low'}
              </Button>
            ))}
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {TIME_SLOT_CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.label} value={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setAddColOpen(true)}
          >
            Add column
          </Button>
          <Button
            type="button"
            size="sm"
            variant={focusMode ? 'secondary' : 'outline'}
            className="h-8"
            onClick={() => setFocusMode((v) => !v)}
          >
            Focus mode
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Archived cards: {archivedCount} (analytics)
      </p>

      <DragDropContext onDragEnd={(r) => void onDragEnd(r)}>
        <div
          className={cn(
            'flex flex-col gap-4 pb-4 md:flex-row md:overflow-x-auto',
            focusMode && 'md:justify-center',
          )}
        >
          {visibleColumns.map((col) => (
            <Card
              key={col.id}
              className="flex w-full shrink-0 flex-col border-border bg-card/40 md:min-w-[280px] md:max-w-[320px]"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                {editingColumnId === col.id ? (
                  <Input
                    value={editColumnTitle}
                    onChange={(e) => setEditColumnTitle(e.target.value)}
                    onBlur={() => void persistColumnTitle(col)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void persistColumnTitle(col)
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    className="text-left text-sm font-semibold hover:text-accent"
                    onDoubleClick={() => {
                      setEditingColumnId(col.id)
                      setEditColumnTitle(col.title)
                    }}
                  >
                    {col.title}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#F59E0B]/25 px-2 py-0.5 text-xs font-medium text-[#F59E0B]">
                    {cardsByColumn(col.id).length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingColumnId(col.id)
                          setEditColumnTitle(col.title)
                        }}
                      >
                        Rename column
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setClearColId(col.id)}>
                        Clear all cards
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={DEFAULT_KANBAN_COLUMNS.some((d) => d.id === col.id)}
                        onClick={() => setDeleteColId(col.id)}
                      >
                        Delete column
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[120px] flex-1 space-y-2 overflow-y-auto p-2"
                  >
                    {cardsByColumn(col.id).map((c, index) => (
                      <Draggable key={c.id} draggableId={c.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(
                              'group relative rounded-md border border-border/80 border-l-4 bg-secondary/40 p-3 text-left transition-shadow',
                              priorityBorder(c.priority),
                              snapshot.isDragging &&
                                'z-50 scale-[1.02] shadow-lg ring-1 ring-[#F59E0B]/40',
                            )}
                          >
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => setCardModal({ ...c })}
                            >
                              <div className="flex items-start justify-between gap-2 pr-14">
                                <p className="text-[14px] font-bold text-white">
                                  {c.title}
                                </p>
                                <span
                                  className={cn(
                                    'h-2 w-2 shrink-0 rounded-full',
                                    c.categoryColour,
                                  )}
                                />
                              </div>
                              {c.dueDate ? (
                                <p
                                  className={cn(
                                    'mt-1 text-xs text-muted-foreground',
                                    isBefore(
                                      parseISO(c.dueDate),
                                      startOfDay(new Date()),
                                    ) && 'text-red-400',
                                  )}
                                >
                                  Due {c.dueDate}
                                </p>
                              ) : null}
                              {c.goalId ? (
                                <span className="mt-1 inline-block text-xs" title="Linked goal">
                                  🎯
                                </span>
                              ) : null}
                            </button>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setCardModal({ ...c })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => void deleteCard(ctx, c.id).then(reload)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="link"
                              className="mt-2 h-auto p-0 text-xs md:hidden"
                              onClick={() => {
                                setMoveModal(c)
                                setMoveTargetCol(
                                  columns.find((x) => x.id !== c.columnId)?.id ?? TODO_ID,
                                )
                              }}
                            >
                              Move to…
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div className="border-t border-border/50 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setCardModal({
                      id: newKanbanCardId(),
                      columnId: col.id,
                      title: '',
                      notes: '',
                      priority: 'medium',
                      category: TIME_SLOT_CATEGORY_OPTIONS[0].label,
                      categoryColour: TIME_SLOT_CATEGORY_OPTIONS[0].colorClass,
                      dueDate: null,
                      goalId: null,
                      order: cardsByColumn(col.id).length,
                      createdAt: new Date().toISOString(),
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add card
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={!!cardModal} onOpenChange={(o) => !o && setCardModal(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {cardModal ? (
            <KanbanCardEditor
              ctx={ctx}
              card={cardModal}
              goals={data.goals.filter((g) => !g.completed)}
              onClose={() => setCardModal(null)}
              onSaved={() => {
                setCardModal(null)
                void reload()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveModal} onOpenChange={(o) => !o && setMoveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move card</DialogTitle>
            <DialogDescription>Choose a column for this card.</DialogDescription>
          </DialogHeader>
          {moveModal ? (
            <>
              <Select value={moveTargetCol} onValueChange={setMoveTargetCol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={c.id === moveModal.columnId}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMoveModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!moveModal || !moveTargetCol) return
                    const dest = columns.find((c) => c.id === moveTargetCol)
                    if (!dest) return
                    const destLen = cards.filter(
                      (c) =>
                        c.columnId === moveTargetCol && c.id !== moveModal.id,
                    ).length
                    const r = await moveCard(
                      ctx,
                      moveModal.id,
                      moveModal.columnId,
                      moveTargetCol,
                      0,
                      destLen,
                    )
                    if (r.error) showToast(r.error, 'error')
                    else {
                      if (moveTargetCol === DONE_ID && moveModal.goalId) {
                        await markGoalDone(moveModal.goalId)
                      }
                      setMoveModal(null)
                      await reload()
                    }
                  }}
                >
                  Move
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={addColOpen} onOpenChange={setAddColOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add column</DialogTitle>
          </DialogHeader>
          <Input
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.target.value)}
            placeholder="Column name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void addColumn()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!clearColId} onOpenChange={(o) => !o && setClearColId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all cards?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every card in this column permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (clearColId) void clearColumnCards(ctx, clearColId).then(reload)
                setClearColId(null)
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteColId} onOpenChange={(o) => !o && setDeleteColId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column?</AlertDialogTitle>
            <AlertDialogDescription>
              Cards will be moved to To Do.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteColId)
                  void deleteColumn(ctx, deleteColId, TODO_ID).then(reload)
                setDeleteColId(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resetOpen} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Good morning!</DialogTitle>
            <DialogDescription>
              You have {incompleteCount} incomplete card
              {incompleteCount === 1 ? '' : 's'}. What would you like to do with them?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => void handleResetChoice('keep')}>
              Keep in To Do
            </Button>
            <Button variant="outline" onClick={() => void handleResetChoice('tomorrow')}>
              Move to tomorrow&apos;s goals
            </Button>
            <Button variant="outline" onClick={() => void handleResetChoice('archive')}>
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KanbanCardEditor({
  ctx,
  card,
  goals,
  onClose,
  onSaved,
}: {
  ctx: ReturnType<typeof useDataServiceContext>
  card: KanbanCard
  goals: Goal[]
  onClose: () => void
  onSaved: () => void
}) {
  const { showToast } = useToast()
  const [title, setTitle] = useState(card.title)
  const [notes, setNotes] = useState(card.notes)
  const [priority, setPriority] = useState<KanbanPriority>(card.priority)
  const [category, setCategory] = useState(card.category)
  const [due, setDue] = useState(card.dueDate ?? '')
  const [goalId, setGoalId] = useState(card.goalId ?? 'none')

  const cat = categoryForLabel(category)

  async function save() {
    if (!title.trim()) {
      showToast('Title is required.', 'error')
      return
    }
    const next: KanbanCard = {
      ...card,
      title: title.trim(),
      notes: notes.trim(),
      priority,
      category: cat.label,
      categoryColour: cat.colorClass,
      dueDate: due.trim() ? due.slice(0, 10) : null,
      goalId: goalId === 'none' ? null : goalId,
    }
    const { error } = await saveCard(ctx, next)
    if (error) showToast(error, 'error')
    else onSaved()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{card.title ? 'Edit card' : 'New card'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div>
          <Label>Priority</Label>
          <RadioGroup
            value={priority}
            onValueChange={(v) => setPriority(v as KanbanPriority)}
            className="mt-2 flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="high" id="p-h" />
              <Label htmlFor="p-h" className="font-normal">
                High
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="medium" id="p-m" />
              <Label htmlFor="p-m" className="font-normal">
                Medium
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="low" id="p-l" />
              <Label htmlFor="p-l" className="font-normal">
                Low
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOT_CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.label} value={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Due date (optional)</Label>
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Link to goal (optional)</Label>
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button
          variant="destructive"
          type="button"
          className="sm:mr-auto"
          onClick={() =>
            void deleteCard(ctx, card.id).then(() => {
              onClose()
              onSaved()
            })
          }
        >
          Delete
        </Button>
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void save()}>
          Save
        </Button>
      </DialogFooter>
    </>
  )
}
