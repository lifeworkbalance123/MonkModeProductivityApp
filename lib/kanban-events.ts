/** Cross-page goal ↔ Kanban sync (CustomEvent on `window`). */
export const KANBAN_GOAL_COMPLETED_EVENT = 'monk-goal-completed'

export type KanbanGoalCompletedDetail = { goalId: string }
