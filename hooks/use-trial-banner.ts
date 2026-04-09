'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePlan } from '@/hooks/usePlan'

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000

function storageKey(userId: string) {
  return `monkmode_pro_trial_ends_at_${userId}`
}

/**
 * Lightweight local trial window for free users (marketing / urgency).
 * First visit sets a 14-day end timestamp; banner promotes /upgrade.
 */
export function useTrialBanner() {
  const { user } = useAuth()
  const { isPro, isLoading: planLoading } = usePlan()
  const [endAt, setEndAt] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id || isPro || planLoading) {
      setEndAt(null)
      return
    }
    const key = storageKey(user.id)
    const existing = localStorage.getItem(key)
    let end: number
    if (existing) {
      end = Number(existing)
      if (!Number.isFinite(end)) {
        end = Date.now() + TRIAL_MS
        localStorage.setItem(key, String(end))
      }
    } else {
      end = Date.now() + TRIAL_MS
      localStorage.setItem(key, String(end))
    }
    setEndAt(end)
  }, [user?.id, isPro, planLoading])

  if (endAt == null || isPro || planLoading || !user?.id) {
    return { visible: false as const, expired: false, daysLeft: 0 }
  }

  const now = Date.now()
  const expired = now >= endAt
  const msLeft = Math.max(0, endAt - now)
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))

  return {
    visible: true as const,
    expired,
    daysLeft,
  }
}
