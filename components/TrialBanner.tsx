'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserIdSafe } from '@/lib/supabaseAuthSafe'
import { cn } from '@/lib/utils'

function trialDaysRemaining(trialEndIso: string): number {
  const ms = new Date(trialEndIso).getTime() - Date.now()
  if (!Number.isFinite(ms)) return 0
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

/** Guided-program trial callout (shared layout for dashboard and Today). */
export function GuidedProgramTrialBanner({
  trialEnd,
  className,
}: {
  trialEnd: string
  className?: string
}) {
  const days = trialDaysRemaining(trialEnd)
  return (
    <div
      className={cn(
        'bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-4 text-foreground dark:bg-yellow-950/40 dark:text-foreground',
        className,
      )}
    >
      ⏳ Trial ends in {days} days.
      <Link href="/pricing" className="ml-2 underline">
        Upgrade now
      </Link>
    </div>
  )
}

/**
 * Shows remaining program-trial days when `user_programs.payment_status` is `trial`.
 */
export function ProgramTrialBanner() {
  const [trialEnd, setTrialEnd] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const userId = await getUserIdSafe()
      if (!userId) return
      const { data } = await supabase
        .from('user_programs')
        .select('trial_end, payment_status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (cancelled || !data) return
      if ((data.payment_status ?? '').toLowerCase() !== 'trial' || !data.trial_end) return
      const end = new Date(data.trial_end as string)
      if (Number.isNaN(end.getTime()) || end <= new Date()) return
      setTrialEnd(data.trial_end as string)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!trialEnd) return null

  return <GuidedProgramTrialBanner trialEnd={trialEnd} />
}
