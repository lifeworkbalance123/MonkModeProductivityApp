'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePlan } from '@/hooks/usePlan'
import type { DataServiceContext } from '@/lib/dataService'

/**
 * Must return a stable object when `userId` + `isPro` are unchanged so hooks that
 * depend on `ctx` (e.g. KanbanBoard reload, useMonkData-derived callbacks) do not
 * re-fire on every render.
 */
export function useDataServiceContext(): DataServiceContext {
  const { user } = useAuth()
  const { isPro } = usePlan()
  const userId = user?.id ?? null
  return useMemo(() => ({ userId, isPro }), [userId, isPro])
}
