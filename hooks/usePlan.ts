'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const ENTITLEMENT_REFRESH = 'monkmode-entitlement-refresh'

export type EntitlementPlan =
  | 'free'
  | 'trial'
  | 'monthly'
  | 'annual'
  | 'lifetime'

type EntitlementResponse = {
  isPro: boolean
  plan: string
  subscriptionEndDate?: string | null
  trialEndDate?: string | null
  isTrial?: boolean
  cancellationDate?: string | null
}

type EntitlementSnapshot = {
  isPro: boolean
  plan: EntitlementPlan
  subscriptionEndDate: string | null
  trialEndDate: string | null
  isTrial: boolean
  cancellationDate: string | null
}

type EntitlementCacheEntry = {
  fetchedAt: number
  value: EntitlementSnapshot
}

const CACHE_TTL_MS = 20_000
const entitlementCache = new Map<string, EntitlementCacheEntry>()
const entitlementInflight = new Map<string, Promise<EntitlementSnapshot>>()
const isDev = process.env.NODE_ENV !== 'production'

function trialDaysRemaining(trialEndIso: string | null): number {
  if (!trialEndIso) return 0
  const end = Date.parse(trialEndIso)
  if (!Number.isFinite(end)) return 0
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)))
}

function computeTrialExpired(
  isPro: boolean,
  trialEndIso: string | null,
  plan: EntitlementPlan,
): boolean {
  if (isPro) return false
  if (!trialEndIso) return false
  const end = Date.parse(trialEndIso)
  if (!Number.isFinite(end)) return false
  if (Date.now() < end) return false
  return plan === 'trial' || plan === 'free'
}

function defaultSnapshot(): EntitlementSnapshot {
  return {
    isPro: false,
    plan: 'free',
    subscriptionEndDate: null,
    trialEndDate: null,
    isTrial: false,
    cancellationDate: null,
  }
}

function normalizeEntitlementResponse(data: EntitlementResponse): EntitlementSnapshot {
  const p = (data.plan ?? 'free').toLowerCase()
  const normalized: EntitlementPlan =
    p === 'monthly' ||
    p === 'annual' ||
    p === 'lifetime' ||
    p === 'trial' ||
    p === 'free'
      ? (p as EntitlementPlan)
      : 'free'

  return {
    isPro: !!data.isPro,
    plan: normalized,
    subscriptionEndDate:
      data.subscriptionEndDate != null ? String(data.subscriptionEndDate) : null,
    trialEndDate: data.trialEndDate != null ? String(data.trialEndDate) : null,
    isTrial: Boolean(data.isTrial),
    cancellationDate:
      data.cancellationDate != null ? String(data.cancellationDate) : null,
  }
}

async function fetchEntitlementShared(
  userId: string,
  opts?: { force?: boolean },
): Promise<EntitlementSnapshot> {
  const force = opts?.force === true
  const logPrefix = `[entitlement:${userId.slice(0, 8)}]`
  const now = Date.now()
  const cached = entitlementCache.get(userId)
  if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    if (isDev) {
      console.info(`${logPrefix} cache-hit age=${now - cached.fetchedAt}ms`)
    }
    return cached.value
  }

  const existing = entitlementInflight.get(userId)
  if (!force && existing) {
    if (isDev) console.info(`${logPrefix} inflight-join`)
    return existing
  }

  const startedAt = performance.now()
  if (isDev) console.info(`${logPrefix} network-fetch start`)
  const promise = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return defaultSnapshot()

      const res = await fetch('/api/user/entitlement', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) return defaultSnapshot()

      const data = (await res.json()) as EntitlementResponse
      return normalizeEntitlementResponse(data)
    } catch {
      return defaultSnapshot()
    }
  })()

  entitlementInflight.set(userId, promise)
  try {
    const value = await promise
    entitlementCache.set(userId, { fetchedAt: Date.now(), value })
    if (isDev) {
      const elapsed = Math.round(performance.now() - startedAt)
      console.info(`${logPrefix} network-fetch done ${elapsed}ms`)
    }
    return value
  } finally {
    entitlementInflight.delete(userId)
  }
}

export type PlanContextValue = {
  isPro: boolean
  plan: EntitlementPlan
  subscriptionEndDate: string | null
  isLoading: boolean
  trialEndDate: string | null
  isTrial: boolean
  cancellationDate: string | null
  daysRemaining: number
  trialExpired: boolean
}

const PlanContext = createContext<PlanContextValue | null>(null)

/**
 * Single entitlement subscription for the whole app. Mount once under `AuthProvider`.
 * (Multiple `usePlan` instances used to each run effects + fetch — thrashing the main thread on navigation.)
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const value = usePlanEntitlementSync()
  return createElement(PlanContext.Provider, { value }, children)
}

function usePlanEntitlementSync(): PlanContextValue {
  const { user, isLoading: authLoading } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [plan, setPlan] = useState<EntitlementPlan>('free')
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(
    null,
  )
  const [planLoading, setPlanLoading] = useState(true)
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null)
  const [isTrial, setIsTrial] = useState(false)
  const [cancellationDate, setCancellationDate] = useState<string | null>(null)

  /** After first resolved fetch for this user, refetches stay silent (no planLoading flash). */
  const entitlementHydratedUserId = useRef<string | null>(null)
  const fetchGeneration = useRef(0)
  const instanceIdRef = useRef(Math.random().toString(36).slice(2, 8))

  const fetchEntitlement = useCallback(async () => {
    if (!user?.id) {
      entitlementHydratedUserId.current = null
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
      setTrialEndDate(null)
      setIsTrial(false)
      setCancellationDate(null)
      setPlanLoading(false)
      return
    }

    const showSpinner = entitlementHydratedUserId.current !== user.id
    if (showSpinner) setPlanLoading(true)

    const gen = ++fetchGeneration.current

    try {
      if (isDev) {
        console.info(
          `[usePlan:${instanceIdRef.current}] fetch start user=${user.id.slice(0, 8)} showSpinner=${showSpinner}`,
        )
      }
      const snapshot = await fetchEntitlementShared(user.id)
      if (gen !== fetchGeneration.current) return

      setIsPro(snapshot.isPro)
      setPlan(snapshot.plan)
      setSubscriptionEndDate(snapshot.subscriptionEndDate)
      setTrialEndDate(snapshot.trialEndDate)
      setIsTrial(snapshot.isTrial)
      setCancellationDate(snapshot.cancellationDate)
      entitlementHydratedUserId.current = user.id
    } finally {
      if (gen === fetchGeneration.current) {
        setPlanLoading(false)
      }
      if (isDev) {
        console.info(
          `[usePlan:${instanceIdRef.current}] fetch end user=${user.id.slice(0, 8)}`,
        )
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      entitlementHydratedUserId.current = null
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
      setTrialEndDate(null)
      setIsTrial(false)
      setCancellationDate(null)
      setPlanLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      await fetchEntitlement()
      if (cancelled) return
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, authLoading, fetchEntitlement])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Token refresh events are frequent and should not refetch entitlement.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return
      void fetchEntitlement()
    })
    return () => subscription.unsubscribe()
  }, [fetchEntitlement])

  useEffect(() => {
    function onRefresh() {
      void fetchEntitlement()
    }
    window.addEventListener(ENTITLEMENT_REFRESH, onRefresh)
    return () => window.removeEventListener(ENTITLEMENT_REFRESH, onRefresh)
  }, [fetchEntitlement])

  const isLoading = authLoading || planLoading
  const daysRemaining = trialDaysRemaining(trialEndDate)
  const trialExpired = computeTrialExpired(isPro, trialEndDate, plan)

  return useMemo(
    () => ({
      isPro,
      plan,
      subscriptionEndDate,
      isLoading,
      trialEndDate,
      isTrial,
      cancellationDate,
      daysRemaining,
      trialExpired,
    }),
    [
      isPro,
      plan,
      subscriptionEndDate,
      isLoading,
      trialEndDate,
      isTrial,
      cancellationDate,
      daysRemaining,
      trialExpired,
    ],
  )
}

/**
 * Server-verified plan from GET /api/user/entitlement (database source of truth).
 * Must be used within `<PlanProvider>` (see `app/providers.tsx`).
 */
export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) {
    throw new Error('usePlan must be used within PlanProvider')
  }
  return ctx
}

export function notifyEntitlementRefresh() {
  if (typeof window !== 'undefined') {
    // Force a fresh server read on explicit refresh events.
    entitlementCache.clear()
    window.dispatchEvent(new Event(ENTITLEMENT_REFRESH))
  }
}
