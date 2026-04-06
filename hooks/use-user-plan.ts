'use client'

import { useSyncExternalStore } from 'react'
import { getUserPlan, hasAccess, planChangeEventName, type UserPlan } from '@/lib/plan'

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onStoreChange()
  window.addEventListener(planChangeEventName, handler)
  return () => window.removeEventListener(planChangeEventName, handler)
}

function getSnapshot(): UserPlan {
  return getUserPlan()
}

function getServerSnapshot(): UserPlan {
  return 'free'
}

export function useUserPlan(): UserPlan {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Re-renders when plan changes; evaluates `hasAccess` for the given feature key. */
export function useHasAccess(feature: string): boolean {
  useUserPlan()
  return hasAccess(feature)
}
