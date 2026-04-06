'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MONTHLY_PRICE = 9
const LIFETIME_PRICE = 149

type UserRow = {
  id: string
  email: string | null
  created_at: string
  last_active_at: string | null
  plan: string
  is_pro: boolean
}

function planLabel(row: Pick<UserRow, 'plan' | 'is_pro'>): string {
  const p = (row.plan ?? '').toLowerCase()
  if (p === 'lifetime') return 'Lifetime'
  if (p === 'monthly' || p === 'pro' || row.is_pro) return 'Pro'
  return 'Free'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

export function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [proUsers, setProUsers] = useState<number | null>(null)
  const [lifetimeUsers, setLifetimeUsers] = useState<number | null>(null)
  const [mrrSubscribers, setMrrSubscribers] = useState<number | null>(null)
  const [recent, setRecent] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserRow[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [announcementLoaded, setAnnouncementLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoadError(null)

      const { count: total, error: e0 } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      if (cancelled) return
      if (e0) {
        setLoadError(e0.message)
        return
      }
      setTotalUsers(total ?? 0)

      const { count: proC, error: e1 } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_pro', true)
      if (cancelled) return
      if (e1) {
        setLoadError(e1.message)
        return
      }
      setProUsers(proC ?? 0)

      const { count: lifeC, error: e2 } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .ilike('plan', 'lifetime')
      if (cancelled) return
      if (e2) {
        setLoadError(e2.message)
        return
      }
      setLifetimeUsers(lifeC ?? 0)

      const { count: mrrC, error: e3 } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'monthly')
      if (cancelled) return
      if (e3) {
        setLoadError(e3.message)
        return
      }
      setMrrSubscribers(mrrC ?? 0)

      const { data: recentRows, error: e4 } = await supabase
        .from('users')
        .select('id, email, created_at, last_active_at, plan, is_pro')
        .order('created_at', { ascending: false })
        .limit(20)
      if (cancelled) return
      if (e4) {
        setLoadError(e4.message)
        return
      }
      setRecent((recentRows as UserRow[]) ?? [])
    })()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)

    ;(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, created_at, last_active_at, plan, is_pro')
        .ilike('email', `%${debouncedSearch}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (cancelled) return
      setSearchLoading(false)
      if (error) {
        setSearchResults([])
        return
      }
      setSearchResults((data as UserRow[]) ?? [])
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('body')
        .eq('id', 1)
        .maybeSingle()

      if (cancelled) return
      if (!error && data && typeof (data as { body?: string }).body === 'string') {
        setAnnouncement((data as { body: string }).body)
      }
      setAnnouncementLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function saveAnnouncement() {
    setAnnouncementSaving(true)
    try {
      const { error } = await supabase.from('announcements').upsert(
        {
          id: 1,
          body: announcement,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      if (error) throw error
    } finally {
      setAnnouncementSaving(false)
    }
  }

  async function togglePro(target: UserRow) {
    const nextPro = !target.is_pro
    const nextPlan = nextPro ? 'monthly' : 'free'
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) return

    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(target.id)}/entitlement`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          is_pro: nextPro,
          plan: nextPlan,
        }),
      },
    )
    if (!res.ok) return

    const updated: UserRow = {
      ...target,
      is_pro: nextPro,
      plan: nextPlan,
    }
    refresh()
    setRecent((prev) =>
      prev.map((r) => (r.id === target.id ? updated : r)),
    )
    setSearchResults((prev) =>
      prev.map((r) => (r.id === target.id ? updated : r)),
    )
  }

  const lifetimeRevenue = useMemo(
    () => (lifetimeUsers ?? 0) * LIFETIME_PRICE,
    [lifetimeUsers],
  )
  const monthlyRevenue = useMemo(
    () => (mrrSubscribers ?? 0) * MONTHLY_PRICE,
    [mrrSubscribers],
  )
  const mrrEstimate = monthlyRevenue

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-16">
      <header className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Admin Panel
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            MonkMode owner tools — not linked from the public app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/store-kit"
            className="text-sm font-medium text-sky-700 hover:text-sky-900 underline-offset-2 hover:underline"
          >
            App Store kit →
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:text-sky-900 underline-offset-2 hover:underline"
          >
            Exit to app →
          </Link>
        </div>
      </header>

      {loadError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Registered users"
            value={totalUsers}
            suffix=""
          />
          <MetricCard label="Pro users (is_pro)" value={proUsers} suffix="" />
          <MetricCard
            label="Lifetime (plan)"
            value={lifetimeUsers}
            suffix=""
          />
          <MetricCard
            label="MRR estimate"
            value={mrrEstimate}
            prefix="$"
            suffix="/mo"
            sub={`Pro monthly × $${MONTHLY_PRICE}`}
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Recent signups
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                <th className="px-4 py-3 font-medium text-slate-700">
                  Signup date
                </th>
                <th className="px-4 py-3 font-medium text-slate-700">Plan</th>
                <th className="px-4 py-3 font-medium text-slate-700">
                  Last active
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 text-slate-800">
                    {row.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {planLabel(row)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(row.last_active_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Revenue summary
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-slate-800">
          <p>
            <span className="text-slate-600">Lifetime purchases:</span>{' '}
            <strong>{lifetimeUsers ?? '—'}</strong> × ${LIFETIME_PRICE} ={' '}
            <strong>${lifetimeRevenue.toLocaleString()}</strong>
          </p>
          <p>
            <span className="text-slate-600">Active monthly subscribers:</span>{' '}
            <strong>{mrrSubscribers ?? '—'}</strong> × ${MONTHLY_PRICE} ={' '}
            <strong>${monthlyRevenue.toLocaleString()}</strong>
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          User search
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by email…"
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
          {searchLoading ? (
            <p className="text-sm text-slate-500">Searching…</p>
          ) : debouncedSearch ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4 font-medium text-slate-700">
                      Email
                    </th>
                    <th className="py-2 pr-4 font-medium text-slate-700">
                      Plan
                    </th>
                    <th className="py-2 pr-4 font-medium text-slate-700">
                      Signup
                    </th>
                    <th className="py-2 font-medium text-slate-700">is_pro</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-slate-500">
                        No users match that email.
                      </td>
                    </tr>
                  ) : (
                    searchResults.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4">{row.email ?? '—'}</td>
                        <td className="py-2 pr-4">{planLabel(row)}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => togglePro(row)}
                            className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
                          >
                            {row.is_pro ? 'Set Free' : 'Set Pro'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Type an email fragment to search the users table.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          App announcement
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs text-slate-600">
            Saved to <code className="text-slate-800">announcements</code> (id
            1). Use for a future in-app banner.
          </p>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            disabled={!announcementLoaded}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            placeholder="Short message for users…"
          />
          <button
            type="button"
            onClick={saveAnnouncement}
            disabled={announcementSaving || !announcementLoaded}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {announcementSaving ? 'Saving…' : 'Save announcement'}
          </button>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  sub,
}: {
  label: string
  value: number | null
  prefix?: string
  suffix?: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
        {value === null ? (
          '—'
        ) : (
          <>
            {prefix}
            {value.toLocaleString()}
            {suffix}
          </>
        )}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}
