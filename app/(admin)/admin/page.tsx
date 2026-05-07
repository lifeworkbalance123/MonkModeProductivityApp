'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_ANNUAL_CENTS,
  DEFAULT_LIFETIME_CENTS,
  DEFAULT_MONTHLY_CENTS,
  findPricingRow,
  formatPriceCents,
  indicativeSubscriptionRates,
  type PricingConfigRow,
} from '@/lib/pricingDisplay'

type AdminStats = {
  totalUsers: number
  trialUsers: number
  proUsers: number
  lifetimeUsers: number
  monthlyUsers: number
  annualUsers: number
  freeUsers: number
  todaySignups: number
  weekSignups: number
  waitlistCount: number
  estimatedMRR: number
}

type UserRow = {
  id: string
  email: string | null
  plan: string | null
  created_at: string | null
  trial_end_date: string | null
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([])
  const [pricingRows, setPricingRows] = useState<PricingConfigRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        const [{ data: users, error }, { data: pricingData, error: pricingError }] =
          await Promise.all([
            supabase
              .from('users')
              .select('id, email, plan, created_at, trial_end_date, is_pro')
              .order('created_at', { ascending: false }),
            supabase.from('pricing_config').select('*'),
          ])

        if (cancelled) return
        if (error) {
          console.error(error)
          return
        }
        if (!pricingError && Array.isArray(pricingData)) {
          setPricingRows(pricingData as PricingConfigRow[])
        }

        const list = (users ?? []) as UserRow[]
        const now = new Date()
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        )
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const monthlyCount = list.filter((u) => u.plan === 'monthly').length
        const annualCount = list.filter((u) => u.plan === 'annual').length
        const rates = indicativeSubscriptionRates(
          (pricingData as PricingConfigRow[] | null) ?? [],
        )

        const calculatedStats: AdminStats = {
          totalUsers: list.length,
          trialUsers: list.filter((u) => u.plan === 'trial').length,
          proUsers: list.filter(
            (u) => u.plan === 'monthly' || u.plan === 'annual',
          ).length,
          lifetimeUsers: list.filter((u) => u.plan === 'lifetime').length,
          monthlyUsers: monthlyCount,
          annualUsers: annualCount,
          freeUsers: list.filter((u) => !u.plan || u.plan === 'free').length,
          todaySignups: list.filter((u) => {
            if (!u.created_at) return false
            return new Date(u.created_at) >= todayStart
          }).length,
          weekSignups: list.filter((u) => {
            if (!u.created_at) return false
            return new Date(u.created_at) >= weekStart
          }).length,
          waitlistCount: 0,
          estimatedMRR:
            monthlyCount * rates.monthlyPerSeatDollars +
            (annualCount * rates.annualPerSeatDollars) / 12,
        }

        const { count } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
        if (!cancelled && count != null) {
          calculatedStats.waitlistCount = count
        }

        if (!cancelled) {
          setStats(calculatedStats)
          setRecentUsers(list.slice(0, 10))
        }
      } catch (err) {
        console.error('Admin stats error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  const planBreakdown = useMemo(() => {
    const m = findPricingRow(pricingRows, 'app_monthly')
    const a = findPricingRow(pricingRows, 'app_annual')
    const l = findPricingRow(pricingRows, 'lifetime')
    const mc = m?.current_price ?? DEFAULT_MONTHLY_CENTS
    const ac = a?.current_price ?? DEFAULT_ANNUAL_CENTS
    const lc = l?.current_price ?? DEFAULT_LIFETIME_CENTS
    const mCur = m?.currency ?? 'AUD'
    const aCur = a?.currency ?? 'AUD'
    const lCur = l?.currency ?? 'AUD'
    return [
      { label: 'Trial (14-day free)', count: stats?.trialUsers ?? 0, color: '#3B82F6' },
      {
        label: `Pro Monthly (${formatPriceCents(mc, mCur)}/mo)`,
        count: stats?.monthlyUsers ?? 0,
        color: '#10B981',
      },
      {
        label: `Pro Annual (${formatPriceCents(ac, aCur)}/yr)`,
        count: stats?.annualUsers ?? 0,
        color: '#8B5CF6',
      },
      {
        label: `Lifetime (${formatPriceCents(lc, lCur)} one-time)`,
        count: stats?.lifetimeUsers ?? 0,
        color: 'var(--accent)',
      },
      { label: 'Free', count: stats?.freeUsers ?? 0, color: 'var(--muted-foreground)' },
    ]
  }, [pricingRows, stats])

  if (loading) {
    return <div className="text-muted-foreground">Loading dashboard…</div>
  }

  const statCards = [
    { label: 'Total users', value: stats?.totalUsers ?? 0, color: 'var(--accent)' },
    { label: 'Active trials', value: stats?.trialUsers ?? 0, color: '#3B82F6' },
    { label: 'Pro subscribers', value: stats?.proUsers ?? 0, color: '#10B981' },
    {
      label: 'Lifetime members',
      value: stats?.lifetimeUsers ?? 0,
      color: '#8B5CF6',
    },
    { label: 'Signups today', value: stats?.todaySignups ?? 0, color: 'var(--accent)' },
    {
      label: 'Signups this week',
      value: stats?.weekSignups ?? 0,
      color: '#3B82F6',
    },
    { label: 'Waitlist', value: stats?.waitlistCount ?? 0, color: '#EC4899' },
    {
      label: 'Est. MRR',
      value: `$${(stats?.estimatedMRR ?? 0).toFixed(0)}`,
      color: '#10B981',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div
              className="text-3xl font-semibold leading-none"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-medium text-foreground">Plan breakdown</h2>
        {planBreakdown.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
              <span className="text-sm text-muted-foreground">{row.label}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{row.count}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-medium text-foreground">Recent signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {['Email', 'Plan', 'Trial ends', 'Signed up'].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border pb-3 text-left text-xs font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="border-b border-border py-3 text-muted-foreground">
                    {user.email ?? '—'}
                  </td>
                  <td className="border-b border-border py-3">
                    <PlanBadge plan={user.plan} />
                  </td>
                  <td className="border-b border-border py-3 text-xs text-muted-foreground">
                    {user.trial_end_date
                      ? new Date(user.trial_end_date).toLocaleDateString('en-AU')
                      : '—'}
                  </td>
                  <td className="border-b border-border py-3 text-xs text-muted-foreground">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-AU')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string | null }) {
  const p = (plan ?? 'free').toLowerCase()
  const bg =
    p === 'trial'
      ? '#1D4ED8'
      : p === 'lifetime'
        ? '#7C3AED'
        : p === 'monthly' || p === 'annual'
          ? '#065F46'
          : '#374151'
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[11px] font-medium capitalize text-white"
      style={{ background: bg }}
    >
      {p || 'free'}
    </span>
  )
}
