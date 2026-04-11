/**
 * Kanban persistence: Pro + cloud → Supabase; otherwise localStorage (`kanban_data`).
 */

import { supabase } from '@/lib/supabase'
import {
  DEFAULT_KANBAN_COLUMNS,
  type KanbanCard,
  type KanbanColumn,
  type KanbanPriority,
} from '@/types/kanban'
import type { DataServiceContext } from '@/lib/dataService'
import { shouldSyncToCloud } from '@/lib/dataService'

const LS_KANBAN = 'kanban_data'
const LS_GOAL_SYNC = 'kanban_goal_sync_enabled'

type KanbanDump = {
  columns: KanbanColumn[]
  cards: KanbanCard[]
  archived: KanbanCard[]
  lastResetDate: string | null
}

function emptyDump(): KanbanDump {
  return {
    columns: DEFAULT_KANBAN_COLUMNS.map((c) => ({ ...c })),
    cards: [],
    archived: [],
    lastResetDate: null,
  }
}

function readLocalDump(): KanbanDump {
  if (typeof window === 'undefined') return emptyDump()
  try {
    const raw = localStorage.getItem(LS_KANBAN)
    if (!raw) return emptyDump()
    const p = JSON.parse(raw) as Partial<KanbanDump>
    const columns =
      Array.isArray(p.columns) && p.columns.length > 0
        ? (p.columns as KanbanColumn[])
        : DEFAULT_KANBAN_COLUMNS.map((c) => ({ ...c }))
    return {
      columns,
      cards: Array.isArray(p.cards) ? (p.cards as KanbanCard[]) : [],
      archived: Array.isArray(p.archived) ? (p.archived as KanbanCard[]) : [],
      lastResetDate:
        typeof p.lastResetDate === 'string' ? p.lastResetDate : null,
    }
  } catch {
    return emptyDump()
  }
}

function writeLocalDump(d: KanbanDump) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_KANBAN, JSON.stringify(d))
  } catch {
    /* quota */
  }
}

export function getGoalSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(LS_GOAL_SYNC) === '1'
}

export function setGoalSyncEnabled(on: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_GOAL_SYNC, on ? '1' : '0')
}

export function getLastResetDateLocal(): string | null {
  return readLocalDump().lastResetDate
}

export function setLastResetDateLocal(dateKey: string) {
  const d = readLocalDump()
  d.lastResetDate = dateKey
  writeLocalDump(d)
}

function rowToCard(r: Record<string, unknown>): KanbanCard {
  const pr = r.priority as string
  const priority: KanbanPriority =
    pr === 'high' || pr === 'low' ? pr : 'medium'
  return {
    id: String(r.id),
    columnId: String(r.column_id),
    title: String(r.title ?? ''),
    notes: String(r.notes ?? ''),
    priority,
    category: String(r.category ?? 'Work'),
    categoryColour: String(r.category_colour ?? 'bg-blue-500'),
    dueDate: r.due_date != null ? String(r.due_date).slice(0, 10) : null,
    goalId: r.goal_id != null ? String(r.goal_id) : null,
    order: Number(r.sort_order ?? 0),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  }
}

async function seedDefaultColumns(ctx: DataServiceContext): Promise<void> {
  if (!ctx.userId) return
  const rows = DEFAULT_KANBAN_COLUMNS.map((c) => ({
    user_id: ctx.userId,
    id: c.id,
    title: c.title,
    sort_order: c.order,
  }))
  const { error } = await supabase.from('kanban_columns').insert(rows)
  if (error) console.error(error)
}

export async function getColumns(
  ctx: DataServiceContext,
): Promise<KanbanColumn[]> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('kanban_columns')
      .select('id,title,sort_order')
      .eq('user_id', ctx.userId)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error(error)
      return readLocalDump().columns
    }
    if (!data?.length) {
      await seedDefaultColumns(ctx)
      const { data: d2 } = await supabase
        .from('kanban_columns')
        .select('id,title,sort_order')
        .eq('user_id', ctx.userId)
        .order('sort_order', { ascending: true })
      return (d2 ?? []).map((r) => ({
        id: r.id,
        title: r.title ?? '',
        order: r.sort_order ?? 0,
      }))
    }
    return data.map((r) => ({
      id: r.id,
      title: r.title ?? '',
      order: r.sort_order ?? 0,
    }))
  }
  return readLocalDump().columns
}

export async function getCards(ctx: DataServiceContext): Promise<KanbanCard[]> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .select(
        'id,column_id,title,notes,priority,category,category_colour,due_date,goal_id,sort_order,created_at',
      )
      .eq('user_id', ctx.userId)
      .order('column_id', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) {
      console.error(error)
      return readLocalDump().cards
    }
    return (data ?? []).map((r) => rowToCard(r as Record<string, unknown>))
  }
  return readLocalDump().cards
}

export async function getArchivedCount(
  ctx: DataServiceContext,
): Promise<number> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { count, error } = await supabase
      .from('kanban_archived_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
    if (error) {
      console.error(error)
      return readLocalDump().archived.length
    }
    return count ?? 0
  }
  return readLocalDump().archived.length
}

export async function saveCard(
  ctx: DataServiceContext,
  card: KanbanCard,
): Promise<{ error: string | null }> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { error } = await supabase.from('kanban_cards').upsert(
      {
        id: card.id,
        user_id: ctx.userId,
        column_id: card.columnId,
        title: card.title,
        notes: card.notes,
        priority: card.priority,
        category: card.category,
        category_colour: card.categoryColour,
        due_date: card.dueDate,
        goal_id: card.goalId,
        sort_order: card.order,
        created_at: card.createdAt,
      },
      { onConflict: 'id' },
    )
    if (error) return { error: error.message }
    return { error: null }
  }
  const d = readLocalDump()
  const idx = d.cards.findIndex((c) => c.id === card.id)
  if (idx >= 0) d.cards[idx] = card
  else d.cards.push(card)
  writeLocalDump(d)
  return { error: null }
}

export async function updateCard(
  ctx: DataServiceContext,
  cardId: string,
  updates: Partial<
    Omit<KanbanCard, 'id' | 'createdAt'> & { createdAt?: string }
  >,
): Promise<{ error: string | null }> {
  const cards = await getCards(ctx)
  const cur = cards.find((c) => c.id === cardId)
  if (!cur) return { error: 'Card not found' }
  const next: KanbanCard = {
    ...cur,
    ...updates,
    id: cur.id,
    createdAt: cur.createdAt,
  }
  return saveCard(ctx, next)
}

export async function clearColumnCards(
  ctx: DataServiceContext,
  columnId: string,
): Promise<void> {
  const cards = await getCards(ctx)
  for (const c of cards.filter((x) => x.columnId === columnId)) {
    await deleteCard(ctx, c.id)
  }
}

export async function deleteCard(
  ctx: DataServiceContext,
  cardId: string,
): Promise<void> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', ctx.userId)
    return
  }
  const d = readLocalDump()
  d.cards = d.cards.filter((c) => c.id !== cardId)
  writeLocalDump(d)
}

export async function saveColumn(
  ctx: DataServiceContext,
  column: KanbanColumn,
): Promise<{ error: string | null }> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { error } = await supabase.from('kanban_columns').upsert(
      {
        user_id: ctx.userId,
        id: column.id,
        title: column.title,
        sort_order: column.order,
      },
      { onConflict: 'user_id,id' },
    )
    if (error) return { error: error.message }
    return { error: null }
  }
  const d = readLocalDump()
  const i = d.columns.findIndex((c) => c.id === column.id)
  if (i >= 0) d.columns[i] = column
  else d.columns.push(column)
  d.columns.sort((a, b) => a.order - b.order)
  writeLocalDump(d)
  return { error: null }
}

export async function deleteColumn(
  ctx: DataServiceContext,
  columnId: string,
  fallbackColumnId: string,
): Promise<void> {
  const cards = await getCards(ctx)
  for (const c of cards.filter((x) => x.columnId === columnId)) {
    await updateCard(ctx, c.id, { columnId: fallbackColumnId })
  }
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    await supabase
      .from('kanban_columns')
      .delete()
      .eq('user_id', ctx.userId)
      .eq('id', columnId)
    return
  }
  const d = readLocalDump()
  d.columns = d.columns.filter((c) => c.id !== columnId)
  d.cards = d.cards.map((c) =>
    c.columnId === columnId ? { ...c, columnId: fallbackColumnId } : c,
  )
  writeLocalDump(d)
}

export async function moveCard(
  ctx: DataServiceContext,
  cardId: string,
  sourceColumnId: string,
  destColumnId: string,
  sourceIndex: number,
  destinationIndex: number,
): Promise<{ error: string | null }> {
  const cards = await getCards(ctx)
  const moving = cards.find((c) => c.id === cardId)
  if (!moving) return { error: 'Card not found' }

  if (sourceColumnId === destColumnId) {
    const list = cards
      .filter((c) => c.columnId === sourceColumnId)
      .sort((a, b) => a.order - b.order)
    const reordered = [...list]
    const [removed] = reordered.splice(sourceIndex, 1)
    if (!removed || removed.id !== cardId) return { error: 'Invalid drag state' }
    reordered.splice(destinationIndex, 0, removed)
    const stamped = reordered.map((c, i) => ({
      ...c,
      order: i,
      columnId: sourceColumnId,
    }))
    for (const c of stamped) {
      const r = await saveCard(ctx, c)
      if (r.error) return r
    }
    return { error: null }
  }

  const others = cards.filter((c) => c.id !== cardId)
  const srcList = others
    .filter((c) => c.columnId === sourceColumnId)
    .sort((a, b) => a.order - b.order)
  const dstList = others
    .filter((c) => c.columnId === destColumnId)
    .sort((a, b) => a.order - b.order)
  const moved = { ...moving, columnId: destColumnId }
  const insertAt = Math.max(0, Math.min(destinationIndex, dstList.length))
  const newDst = [...dstList.slice(0, insertAt), moved, ...dstList.slice(insertAt)]
  const stampedSrc = srcList.map((c, i) => ({ ...c, order: i }))
  const stampedDst = newDst.map((c, i) => ({ ...c, order: i }))

  for (const c of stampedSrc) {
    const r = await saveCard(ctx, c)
    if (r.error) return r
  }
  for (const c of stampedDst) {
    const r = await saveCard(ctx, c)
    if (r.error) return r
  }
  return { error: null }
}

export async function replaceAllCards(
  ctx: DataServiceContext,
  cards: KanbanCard[],
): Promise<{ error: string | null }> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('user_id', ctx.userId)
    if (error) return { error: error.message }
    if (cards.length === 0) return { error: null }
    const rows = cards.map((c) => ({
      id: c.id,
      user_id: ctx.userId,
      column_id: c.columnId,
      title: c.title,
      notes: c.notes,
      priority: c.priority,
      category: c.category,
      category_colour: c.categoryColour,
      due_date: c.dueDate,
      goal_id: c.goalId,
      sort_order: c.order,
      created_at: c.createdAt,
    }))
    const { error: e2 } = await supabase.from('kanban_cards').insert(rows)
    if (e2) return { error: e2.message }
    return { error: null }
  }
  const d = readLocalDump()
  d.cards = cards
  writeLocalDump(d)
  return { error: null }
}

export async function replaceAllColumns(
  ctx: DataServiceContext,
  columns: KanbanColumn[],
): Promise<{ error: string | null }> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const { error } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('user_id', ctx.userId)
    if (error) return { error: error.message }
    if (columns.length === 0) return { error: null }
    const { error: e2 } = await supabase.from('kanban_columns').insert(
      columns.map((c) => ({
        user_id: ctx.userId,
        id: c.id,
        title: c.title,
        sort_order: c.order,
      })),
    )
    if (e2) return { error: e2.message }
    return { error: null }
  }
  const d = readLocalDump()
  d.columns = columns
  writeLocalDump(d)
  return { error: null }
}

export async function archiveCards(
  ctx: DataServiceContext,
  cards: KanbanCard[],
): Promise<{ error: string | null }> {
  if (shouldSyncToCloud(ctx) && ctx.userId) {
    const rows = cards.map((c) => ({
      id: c.id,
      user_id: ctx.userId,
      column_id: c.columnId,
      title: c.title,
      notes: c.notes,
      priority: c.priority,
      category: c.category,
      category_colour: c.categoryColour,
      due_date: c.dueDate,
      goal_id: c.goalId,
      sort_order: c.order,
      created_at: c.createdAt,
    }))
    const { error } = await supabase.from('kanban_archived_cards').insert(rows)
    if (error) return { error: error.message }
    for (const c of cards) {
      await deleteCard(ctx, c.id)
    }
    return { error: null }
  }
  const d = readLocalDump()
  d.archived.push(...cards)
  d.cards = d.cards.filter((c) => !cards.some((a) => a.id === c.id))
  writeLocalDump(d)
  return { error: null }
}

export function newKanbanCardId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `kc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function newKanbanColumnId(): string {
  return newKanbanCardId()
}
