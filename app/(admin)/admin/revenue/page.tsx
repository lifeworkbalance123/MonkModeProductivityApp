'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminRevenuePage() {
  const [monthly, setMonthly] = useState<number | null>(null)
  const [annual, setAnnual] = useState<number | null>(null)
  const [lifetime, setLifetime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [m, a, l] = await Promise.all([
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
        ])
        if (cancelled) return
        setMonthly(m.count ?? 0)
        setAnnual(a.count ?? 0)
        setLifetime(l.count ?? 0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const mrr = (monthly ?? 0) * 9.99 + ((annual ?? 0) * 59.99) / 12
  const lifetimeRev = (lifetime ?? 0) * 149

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Revenue</h1>
      <p className="mt-2 text-sm text-slate-500">
        Indicative numbers from plan counts (not Stripe cash). See{' '}
        <Link href="/admin" className="text-amber-400 underline">
          Overview
        </Link>{' '}
        for signups and waitlist.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Monthly subscribers"
            value={String(monthly ?? 0)}
            hint="$9.99/mo each (indicative)"
          />
          <Stat
            label="Annual subscribers"
            value={String(annual ?? 0)}
            hint="$59.99/yr each (indicative)"
          />
          <Stat
            label="Lifetime"
            value={String(lifetime ?? 0)}
            hint="$149 each (one-time, indicative)"
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
    <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
      <div className="text-2xl font-semibold text-amber-400">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{label}</div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  )
}
