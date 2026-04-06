'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const ENTITLEMENT_REFRESH = 'monkmode-entitlement-refresh'

export type EntitlementPlan = 'free' | 'monthly' | 'lifetime'

type EntitlementResponse = {
  isPro: boolean
  plan: string
  subscriptionEndDate?: string | null
}

/**
 * Server-verified plan from GET /api/user/entitlement (database source of truth).
 */
export function usePlan() {
  const { user, isLoading: authLoading } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [plan, setPlan] = useState<EntitlementPlan>('free')
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(
    null,
  )
  const [planLoading, setPlanLoading] = useState(true)

  const fetchEntitlement = useCallback(async () => {
    if (!user?.id) {
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
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
      setPlanLoading(false)
      return
    }

    const data = (await res.json()) as EntitlementResponse
    const p = (data.plan ?? 'free').toLowerCase()
    const normalized: EntitlementPlan =
      p === 'monthly' || p === 'lifetime' || p === 'free' ? p : 'free'

    setIsPro(!!data.isPro)
    setPlan(normalized)
    setSubscriptionEndDate(
      data.subscriptionEndDate != null
        ? String(data.subscriptionEndDate)
        : null,
    )
    setPlanLoading(false)
  }, [user?.id, user?.email])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsPro(false)
      setPlan('free')
      setSubscriptionEndDate(null)
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

  return { isPro, plan, subscriptionEndDate, isLoading }
}

export function notifyEntitlementRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ENTITLEMENT_REFRESH))
  }
}
