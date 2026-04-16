'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import * as DataService from '@/lib/dataService'
import type { DataServiceContext as DataServiceCtx } from '@/lib/dataService'
import { useAuth } from '@/context/AuthContext'
import { usePlan } from '@/hooks/usePlan'

type DataServiceModule = typeof DataService

type DataServiceProviderValue = {
  context: DataServiceCtx
  service: DataServiceModule
}

const DataServiceContext = createContext<DataServiceProviderValue>({
  context: { userId: null, isPro: false },
  service: DataService,
})

export function DataServiceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { isPro } = usePlan()

  const value = useMemo<DataServiceProviderValue>(
    () => ({
      context: { userId: user?.id ?? null, isPro },
      service: DataService,
    }),
    [user?.id, isPro],
  )

  return (
    <DataServiceContext.Provider value={value}>
      {children}
    </DataServiceContext.Provider>
  )
}

export function useDataService() {
  return useContext(DataServiceContext).service
}

export function useDataServiceContextValue() {
  return useContext(DataServiceContext).context
}

