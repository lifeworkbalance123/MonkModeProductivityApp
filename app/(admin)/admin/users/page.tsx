'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDaysSinceStart } from '@/lib/programUtils'
import UserTable from '@/components/admin/UserTable'

type UserRow = {
  id: string
  email: string | null
  plan: string | null
  is_admin?: boolean | null
  trial_end_date: string | null
  created_at: string | null
  subscription_end_date?: string | null
  program_pro_access_until?: string | null
}

type EnrollmentRow = {
  start_date: string
  current_day: number | null
}

function TestModePanel() {
  const [testMode, setTestMode] = useState(false)
  const [testDay, setTestDay] = useState(1)
  const [enrollmentRow, setEnrollmentRow] = useState<EnrollmentRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadTestMode = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('test_mode_enabled, test_day_override')
      .eq('id', user.id)
      .maybeSingle()

    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('start_date, current_day')
      .eq('user_id', user.id)
      .maybeSingle()

    setTestMode(userData?.test_mode_enabled === true)
    setTestDay(
      (typeof userData?.test_day_override === 'number' && Number.isFinite(userData.test_day_override)
        ? userData.test_day_override
        : null) ??
        (typeof enrollment?.current_day === 'number' ? enrollment.current_day : null) ??
        1,
    )
    setEnrollmentRow(enrollment as EnrollmentRow | null)
  }, [])

  useEffect(() => {
    void loadTestMode()
  }, [loadTestMode])

  async function saveTestMode() {
    setSaving(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('users')
      .update({
        test_mode_enabled: testMode,
        test_day_override: testMode ? testDay : null,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage(
      testMode
        ? `✅ Test mode ON — you are now on Day ${testDay}. Go to /today to test.`
        : '✅ Test mode OFF — back to real day progression.',
    )
    window.setTimeout(() => setMessage(''), 5000)
    await loadTestMode()
  }

  async function advanceOneDay() {
    const nextDay = Math.min(testDay + 1, 60)
    setTestDay(nextDay)

    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('users')
      .update({
        test_mode_enabled: true,
        test_day_override: nextDay,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage(`✅ Advanced to Day ${nextDay}. Go to /today to see it.`)
    window.setTimeout(() => setMessage(''), 4000)
    await loadTestMode()
  }

  async function resetToDay1() {
    setTestDay(1)
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const { error: enrErr } = await supabase
      .from('program_enrollments')
      .update({
        start_date: today,
        current_day: 1,
        completed_days: [],
        phase: 'student',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (enrErr) {
      setSaving(false)
      setMessage(enrErr.message)
      return
    }

    const { error: userErr } = await supabase
      .from('users')
      .update({
        test_mode_enabled: false,
        test_day_override: null,
      })
      .eq('id', user.id)

    setTestMode(false)
    setSaving(false)
    if (userErr) {
      setMessage(userErr.message)
      return
    }
    setMessage('✅ Reset to Day 1. Start date set to today.')
    window.setTimeout(() => setMessage(''), 4000)
    await loadTestMode()
  }

  const realDay = enrollmentRow?.start_date ? getDaysSinceStart(enrollmentRow.start_date) : 1

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        marginBottom: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '20px' }}>🧪</span>
        <div>
          <h3 style={{ color: 'var(--foreground)', fontSize: '16px', fontWeight: '600', margin: '0 0 2px' }}>
            Test Mode — Your Account
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: 0 }}>
            Override your program day to test any lesson without waiting. Only affects your account.
            To reset <strong>another</strong> user to Day 1, change their program, or set test mode for them,
            use <strong>Progress &amp; support</strong> below → <strong>Reset</strong>.
          </p>
        </div>
        {testMode ? (
          <span
            style={{
              marginLeft: 'auto',
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '4px',
            }}
          >
            TEST MODE ON
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: 'var(--background)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: '0 0 4px' }}>Real day</p>
          <p style={{ color: 'var(--foreground)', fontSize: '20px', fontWeight: '700', margin: 0 }}>{realDay}</p>
        </div>
        <div style={{ background: 'var(--background)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: '0 0 4px' }}>Test day</p>
          <p style={{ color: testMode ? 'var(--accent)' : 'var(--muted-foreground)', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {testMode ? testDay : '—'}
          </p>
        </div>
        <div style={{ background: 'var(--background)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: '0 0 4px' }}>Status</p>
          <p style={{ color: testMode ? 'var(--accent)' : '#10B981', fontSize: '13px', fontWeight: '600', margin: 0 }}>
            {testMode ? 'Override' : 'Normal'}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          marginBottom: '12px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: 'var(--foreground)',
            fontSize: '14px',
          }}
        >
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            style={{
              cursor: 'pointer',
              width: '16px',
              height: '16px',
            }}
          />
          Enable test mode
        </label>

        <div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: '0 0 4px' }}>Jump to day</p>
          <input
            type="number"
            min={1}
            max={60}
            value={testDay}
            onChange={(e) =>
              setTestDay(Math.min(60, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))
            }
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--foreground)',
              fontSize: '14px',
              width: '80px',
              outline: 'none',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => void saveTestMode()}
          disabled={saving}
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-foreground)',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 20px',
            cursor: saving ? 'wait' : 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {saving ? 'Saving...' : 'Apply'}
        </button>

        <button
          type="button"
          onClick={() => void advanceOneDay()}
          disabled={saving || testDay >= 60}
          style={{
            background: 'var(--card)',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '9px 16px',
            cursor: saving || testDay >= 60 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          +1 Day
        </button>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Reset your enrollment to Day 1? This will clear all completed days.',
              )
            ) {
              void resetToDay1()
            }
          }}
          disabled={saving}
          style={{
            background: 'transparent',
            color: '#EF4444',
            border: '1px solid #EF444444',
            borderRadius: '8px',
            padding: '9px 16px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          Reset to Day 1
        </button>
      </div>

      {message ? (
        <div
          style={{
            background: 'var(--background)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: message.startsWith('✅') ? '#10B981' : '#F87171',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
        >
          {message}
        </div>
      ) : null}

      <div
        style={{
          marginTop: '12px',
          padding: '12px',
          background: 'var(--background)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 6px', fontWeight: '500' }}>How to use:</p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>
          1. Tick &quot;Enable test mode&quot;
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>
          2. Type a day number (1-60) in &quot;Jump to day&quot;
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>
          3. Click Apply
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>
          4. Go to /today — you will see that day&apos;s lesson
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>
          5. Use +1 Day to step through lessons one at a time
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
          6. Turn off test mode when done — real day progression resumes
        </p>
      </div>
    </div>
  )
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
        'id, email, plan, is_admin, trial_end_date, created_at, is_pro, subscription_end_date, program_pro_access_until',
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

  async function adjustProgramBundlePro(userId: string, days: number) {
    setUpdatingUser(userId)
    setMessage('')
    setErrorMsg('')
    const ok = await patchUser(userId, { extend_program_pro_days: days })
    if (ok) {
      setMessage(
        days === 0
          ? 'No change'
          : days > 0
            ? `Bundle Pro end +${days} day(s)`
            : `Bundle Pro end ${days} day(s)`,
      )
      await loadUsers()
    }
    setUpdatingUser(null)
    window.setTimeout(() => setMessage(''), 3000)
  }

  async function adjustProgramMaxDay(userId: string, delta: number) {
    setUpdatingUser(userId)
    setMessage('')
    setErrorMsg('')
    const ok = await patchUser(userId, { extend_max_program_day_by: delta })
    if (ok) {
      setMessage(
        delta === 0
          ? 'No change'
          : delta > 0
            ? `Max program day +${delta}`
            : `Max program day ${delta}`,
      )
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
      <TestModePanel />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Program progress, at-risk flags, and support actions. Legacy plan table below.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="mb-2 text-lg font-medium text-foreground">Progress & support</h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Click an email or{' '}
          <span className="font-medium text-foreground">Details</span> for extend trial (pick Sprint /
          Monk Mode / Transform + extra days). The row itself is not clickable — use{' '}
          <span className="font-medium text-foreground">Trial</span> in Actions for the compact extend
          dialog.
        </p>
        <UserTable />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-foreground">Plans & trials</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {users.length} total users. For Sprint / Monk Mode / Transform, bundled Pro ends at the end of
          program length + 30 calendar days from enrollment (day 1 = start). Use ± buttons to adjust
          bundle Pro end or max program day (not below track default).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:max-w-sm"
        />
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
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

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    'Email',
                    'Plan',
                    'Trial ends',
                    'Bundle Pro ends',
                    'Subscription renew',
                    'Signed up',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border">
                    <td className="px-5 py-3.5 text-muted-foreground">
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
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {user.trial_end_date
                        ? new Date(user.trial_end_date).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {user.program_pro_access_until
                        ? new Date(user.program_pro_access_until).toLocaleString('en-AU')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {user.subscription_end_date
                        ? new Date(user.subscription_end_date).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
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
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() => void extendTrial(user.id)}
                        >
                          +14 day trial
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() => void adjustProgramBundlePro(user.id, 30)}
                          title="Add 30 calendar days to bundle Pro end (from today if expired, else from current end)"
                        >
                          Bundle Pro +30
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() => void adjustProgramBundlePro(user.id, -7)}
                          title="Subtract 7 days from bundle Pro end (requires an existing bundle end date)"
                        >
                          Bundle Pro −7
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() => void adjustProgramMaxDay(user.id, 7)}
                          title="Increase max program day by 7 (needs enrollment)"
                        >
                          Program +7
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                          disabled={updatingUser === user.id}
                          onClick={() => void adjustProgramMaxDay(user.id, -7)}
                          title="Decrease max program day by 7 (not below default track length)"
                        >
                          Program −7
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
