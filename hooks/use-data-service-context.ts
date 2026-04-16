'use client'

import type { DataServiceContext } from '@/lib/dataService'
import { useDataServiceContextValue } from '@/context/DataServiceContext'

/**
 * Must return a stable object when `userId` + `isPro` are unchanged so hooks that
 * depend on `ctx` (e.g. KanbanBoard reload, useMonkData-derived callbacks) do not
 * re-fire on every render.
 */
export function useDataServiceContext(): DataServiceContext {
  return useDataServiceContextValue()
}
