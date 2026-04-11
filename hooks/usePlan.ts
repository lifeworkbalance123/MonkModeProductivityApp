'use client'

import { useCallback, useEffect, useState } from 'react'
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

/**
 * Server-verified plan from GET /api/user/entitlement (database source of truth).
 * `isPro` is true for paid Pro and for users inside the active 14-day trial window.
 */
export function usePlan() {
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

  const fetchEntitlement = useCallback(async () => {
    if (!user?.id) {
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
      setTrialEndDate(null)
      setIsTrial(false)
      setCancellationDate(null)
      setPlanLoading(false)
      return
    }

    setPlanLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
      setTrialEndDate(null)
      setIsTrial(false)
      setCancellationDate(null)
      setPlanLoading(false)
      return
    }

    const res = await fetch('/api/user/entitlement', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
      setTrialEndDate(null)
      setIsTrial(false)
      setCancellationDate(null)
      setPlanLoading(false)
      return
    }

    const data = (await res.json()) as EntitlementResponse
    const p = (data.plan ?? 'free').toLowerCase()
    const normalized: EntitlementPlan =
      p === 'monthly' ||
      p === 'annual' ||
      p === 'lifetime' ||
      p === 'trial' ||
      p === 'free'
        ? (p as EntitlementPlan)
        : 'free'

    setIsPro(!!data.isPro)
    setPlan(normalized)
    setSubscriptionEndDate(
      data.subscriptionEndDate != null
        ? String(data.subscriptionEndDate)
        : null,
    )
    setTrialEndDate(data.trialEndDate != null ? String(data.trialEndDate) : null)
    setIsTrial(Boolean(data.isTrial))
    setCancellationDate(
      data.cancellationDate != null ? String(data.cancellationDate) : null,
    )
    setPlanLoading(false)
  }, [user?.id, user?.email])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
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
  }, [user, authLoading, fetchEntitlement])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') return
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

  return {
    isPro,
    plan,
    subscriptionEndDate,
    isLoading,
    trialEndDate,
    isTrial,
    cancellationDate,
    daysRemaining,
    trialExpired,
  }
}

export function notifyEntitlementRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ENTITLEMENT_REFRESH))
  }
}
