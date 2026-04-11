export type KanbanColumn = {
  id: string
  title: string
  order: number
}

export type KanbanPriority = 'high' | 'medium' | 'low'

export type KanbanCard = {
  id: string
  columnId: string
  title: string
  notes: string
  priority: KanbanPriority
  category: string
  categoryColour: string
  dueDate: string | null
  goalId: string | null
  order: number
  createdAt: string
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', order: 0 },
  { id: 'inprogress', title: 'In Progress', order: 1 },
  { id: 'done', title: 'Done', order: 2 },
]
