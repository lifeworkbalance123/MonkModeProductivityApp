'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type UserRow = {
  id: string
  email: string | null
  plan: string | null
  is_admin?: boolean | null
  trial_end_date: string | null
  created_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, email, plan, is_admin, trial_end_date, created_at, is_pro',
      )
      .order('created_at', { ascending: false })
    if (error) {
      setErrorMsg(error.message)
      setUsers([])
    } else {
      setErrorMsg('')
      setUsers((data as UserRow[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function patchUser(userId: string, body: Record<string, unknown>) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setErrorMsg('No session')
      return false
    }
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(userId)}/entitlement`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    )
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      setErrorMsg(json.error ?? `HTTP ${res.status}`)
      return false
    }
    return true
  }

  async function toggleProAccess(userId: string, currentPlan: string | null) {
    setUpdatingUser(userId)
    setMessage('')
    setErrorMsg('')
    const p = (currentPlan ?? 'free').toLowerCase()
    const isPaid = p === 'monthly' || p === 'annual' || p === 'lifetime'
    const ok = await patchUser(userId, {
      plan: isPaid ? 'free' : 'monthly',
      is_pro: !isPaid,
    })
    if (ok) {
      setMessage(isPaid ? 'Revoked paid access' : 'Granted Pro (monthly)')
      await loadUsers()
    }
    setUpdatingUser(null)
    window.setTimeout(() => {
      setMessage('')
    }, 3000)
  }

  async function extendTrial(userId: string) {
    setUpdatingUser(userId)
    setMessage('')
    setErrorMsg('')
    const trialEnd = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString()
    const ok = await patchUser(userId, {
      plan: 'trial',
      is_pro: false,
      trial_end_date: trialEnd,
      is_trial_active: true,
    })
    if (ok) {
      setMessage('Trial extended 14 days')
      await loadUsers()
    }
    setUpdatingUser(null)
    window.setTimeout(() => setMessage(''), 3000)
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchPlan = filterPlan === 'all' || (u.plan ?? 'free') === filterPlan
    return matchSearch && matchPlan
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Users</h1>
        <p className="mt-1 text-sm text-slate-500">{users.length} total users</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-600 bg-[#1E293B] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 sm:max-w-sm"
        />
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="rounded-lg border border-slate-600 bg-[#1E293B] px-3 py-2 text-sm text-white"
        >
          <option value="all">All plans</option>
          <option value="trial">Trial</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
          <option value="lifetime">Lifetime</option>
          <option value="free">Free</option>
        </select>
        {message ? (
          <span className="text-sm text-emerald-400">✓ {message}</span>
        ) : null}
        {errorMsg ? (
          <span className="text-sm text-red-400">{errorMsg}</span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#1E293B]">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-600">
                  {['Email', 'Plan', 'Trial ends', 'Signed up', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-medium text-slate-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-slate-900">
                    <td className="px-5 py-3.5 text-slate-300">
                      {user.email ?? '—'}
                      {user.is_admin ? (
                        <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          ADMIN
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <PlanBadge plan={user.plan} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {user.trial_end_date
                        ? new Date(user.trial_end_date).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-600 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() =>
                            void toggleProAccess(user.id, user.plan)
                          }
                        >
                          {(() => {
                            const p = (user.plan ?? 'free').toLowerCase()
                            const paid =
                              p === 'monthly' ||
                              p === 'annual' ||
                              p === 'lifetime'
                            return paid ? 'Revoke paid' : 'Grant monthly'
                          })()}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-600 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() => void extendTrial(user.id)}
                        >
                          +14 day trial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      className="inline-block rounded px-2.5 py-1 text-[11px] font-medium capitalize text-white"
      style={{ background: bg }}
    >
      {p}
    </span>
  )
}
