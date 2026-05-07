'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  indicativeSubscriptionRates,
  type PricingConfigRow,
} from '@/lib/pricingDisplay'

export default function AdminRevenuePage() {
  const [monthly, setMonthly] = useState<number | null>(null)
  const [annual, setAnnual] = useState<number | null>(null)
  const [lifetime, setLifetime] = useState<number | null>(null)
  const [pricingRows, setPricingRows] = useState<PricingConfigRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [m, a, l, pc] = await Promise.all([
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'monthly'),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'annual'),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'lifetime'),
          supabase.from('pricing_config').select('*'),
        ])
        if (cancelled) return
        setMonthly(m.count ?? 0)
        setAnnual(a.count ?? 0)
        setLifetime(l.count ?? 0)
        if (!pc.error && Array.isArray(pc.data)) {
          setPricingRows(pc.data as PricingConfigRow[])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rates = useMemo(() => indicativeSubscriptionRates(pricingRows), [pricingRows])

  const mrr =
    (monthly ?? 0) * rates.monthlyPerSeatDollars +
    ((annual ?? 0) * rates.annualPerSeatDollars) / 12
  const lifetimeRev = (lifetime ?? 0) * rates.lifetimePerSeatDollars

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Revenue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Indicative numbers from plan counts (not Stripe cash). See{' '}
        <Link href="/admin" className="text-accent underline">
          Overview
        </Link>{' '}
        for signups and waitlist.
      </p>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Monthly subscribers"
            value={String(monthly ?? 0)}
            hint={rates.monthlyHint}
          />
          <Stat
            label="Annual subscribers"
            value={String(annual ?? 0)}
            hint={rates.annualHint}
          />
          <Stat
            label="Lifetime"
            value={String(lifetime ?? 0)}
            hint={rates.lifetimeHint}
          />
          <Stat
            label="Est. MRR (monthly + annual spread)"
            value={`$${mrr.toFixed(0)}`}
            hint="Rough; use Stripe for truth"
          />
          <Stat
            label="Lifetime revenue (indicative)"
            value={`$${lifetimeRev.toFixed(0)}`}
            hint="Sum of lifetime seats × list price"
          />
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-2xl font-semibold text-accent">{value}</div>
      <div className="mt-1 text-sm text-foreground">{label}</div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
