'use client'

import { useCallback, useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { usePlan } from '@/hooks/usePlan'
import { setUserAsProTrial } from '@/lib/devUtils'

type Json = Record<string, unknown> | null

export function DebugPageClient() {
  const plan = usePlan()
  const [authJson, setAuthJson] = useState<Json>(null)
  const [usersRow, setUsersRow] = useState<Json>(null)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [entitlementJson, setEntitlementJson] = useState<Json>(null)
  const [entitlementError, setEntitlementError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setUsersError(null)
    setEntitlementError(null)

    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData.user) {
      setAuthJson(null)
      setUsersRow(null)
      setEntitlementJson(null)
      setUsersError(authErr?.message ?? 'Not signed in')
      return
    }

    const u = authData.user
    setAuthJson({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
    })

    const { data: row, error: rowErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', u.id)
      .maybeSingle()

    if (rowErr) {
      setUsersRow(null)
      setUsersError(rowErr.message)
    } else {
      setUsersRow(row as unknown as Json)
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setEntitlementJson(null)
      setEntitlementError('No access token')
      return
    }

    const res = await fetch('/api/user/entitlement', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const text = await res.text()
    try {
      setEntitlementJson(JSON.parse(text) as Json)
    } catch {
      setEntitlementJson({ raw: text })
    }
    if (!res.ok) {
      setEntitlementError(`HTTP ${res.status}`)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onEnsureTrial() {
    setBusy(true)
    setToast(null)
    const r = await setUserAsProTrial()
    setToast(r.message)
    setBusy(false)
    await load()
  }

  const canAccessPro =
    !plan.isLoading && plan.isPro ? 'YES' : plan.isLoading ? '…' : 'NO'

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <Navigation />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 pt-24 font-mono text-sm">
        <h1 className="text-lg font-semibold text-amber-200">
          /debug — entitlement diagnostic
        </h1>
        <p className="text-xs text-gray-400">
          Remove this route before public launch if you prefer not to expose
          billing state.
        </p>
        <p className="text-xs text-amber-200/80">
          For &quot;Set … Pro trial&quot; on production, set env{' '}
          <code className="text-gray-200">ALLOW_TRIAL_DEBUG_UPSERT=1</code> on
          the server (e.g. Vercel). Local dev works with NODE_ENV=development.
        </p>

        <section className="space-y-2">
          <h2 className="text-amber-100/90">1. Auth user (getUser)</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border border-gray-700 bg-black/40 p-3 text-xs">
            {authJson ? JSON.stringify(authJson, null, 2) : '—'}
          </pre>
        </section>

        <section className="space-y-2">
          <h2 className="text-amber-100/90">
            2. public.users row (client select *)
          </h2>
          {usersError ? (
            <p className="text-red-400">{usersError}</p>
          ) : null}
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border border-gray-700 bg-black/40 p-3 text-xs">
            {usersRow ? JSON.stringify(usersRow, null, 2) : 'null (no row)'}
          </pre>
        </section>

        <section className="space-y-2">
          <h2 className="text-amber-100/90">3. usePlan()</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-gray-700 bg-black/40 p-3 text-xs">
            {JSON.stringify(
              {
                isPro: plan.isPro,
                plan: plan.plan,
                isTrial: plan.isTrial,
                daysRemaining: plan.daysRemaining,
                trialExpired: plan.trialExpired,
                isLoading: plan.isLoading,
                trialEndDate: plan.trialEndDate,
                subscriptionEndDate: plan.subscriptionEndDate,
              },
              null,
              2,
            )}
          </pre>
        </section>

        <section className="space-y-2">
          <h2 className="text-amber-100/90">4. GET /api/user/entitlement</h2>
          {entitlementError ? (
            <p className="text-red-400">{entitlementError}</p>
          ) : null}
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border border-gray-700 bg-black/40 p-3 text-xs">
            {entitlementJson
              ? JSON.stringify(entitlementJson, null, 2)
              : '—'}
          </pre>
        </section>

        <section className="space-y-2">
          <h2 className="text-amber-100/90">5. Pro gate resolves to</h2>
          <p className="text-base">
            Can access Pro features:{' '}
            <span className="font-bold text-amber-300">{canAccessPro}</span>
          </p>
        </section>

        <section className="space-y-3 border-t border-gray-700 pt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onEnsureTrial()}
            className="rounded border border-amber-600/80 bg-amber-950/40 px-4 py-3 text-sm text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Set current user as Pro trial (testing only)'}
          </button>
          {toast ? (
            <p className="text-xs text-gray-300 whitespace-pre-wrap">{toast}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-4 rounded border border-gray-600 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
          >
            Reload data
          </button>
        </section>
      </div>
    </div>
  )
}
