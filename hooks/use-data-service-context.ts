'use client'

import { useAuth } from '@/context/AuthContext'
import { usePlan } from '@/hooks/usePlan'
import type { DataServiceContext } from '@/lib/dataService'

export function useDataServiceContext(): DataServiceContext {
  const { user } = useAuth()
  const { isPro } = usePlan()
  return { userId: user?.id ?? null, isPro }
}
