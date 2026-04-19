'use client'

import { useCallback, useEffect, useState } from 'react'
import { AppPageChrome } from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { usePlan } from '@/hooks/usePlan'

type Json = Record<string, unknown> | null

export function DebugPageClient() {
  const plan = usePlan()
  const [authJson, setAuthJson] = useState<Json>(null)
  const [usersRow, setUsersRow] = useState<Json>(null)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [entitlementJson, setEntitlementJson] = useState<Json>(null)
  const [entitlementError, setEntitlementError] = useState<string | null>(null)
  const [proMessage, setProMessage] = useState('')
  const [proLoading, setProLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

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

  async function handleSetPro() {
    setProLoading(true)
    setProMessage('')
    try {
      const { setUserAsPro } = await import('@/lib/devUtils')
      const result = await setUserAsPro()
      setProMessage(result.message)
      if (result.success) {
        window.setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        await load()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setProMessage('Error: ' + msg)
    } finally {
      setProLoading(false)
    }
  }

  async function handleGrantAdmin() {
    setAdminLoading(true)
    setAdminMessage('')
    try {
      const { grantAdminToSelf } = await import('@/lib/devUtils')
      const result = await grantAdminToSelf()
      setAdminMessage(result.message)
      if (result.success) {
        await load()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setAdminMessage('Error: ' + msg)
    } finally {
      setAdminLoading(false)
    }
  }

  const canAccessPro =
    !plan.isLoading && plan.isPro ? 'YES' : plan.isLoading ? '…' : 'NO'

  return (
    <AppPageChrome>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 pt-4 font-mono text-sm md:pt-2">
        <h1 className="text-lg font-semibold text-amber-200">
          /debug — entitlement diagnostic
        </h1>
        <p className="text-xs text-gray-400">
          Remove this route before public launch if you prefer not to expose
          billing state.
        </p>
        <p className="text-xs text-amber-200/80">
          &quot;Set … Pro trial&quot; uses the browser Supabase client (upsert). If
          it fails with RLS, run the migration{' '}
          <code className="text-gray-200">
            20260412120000_users_restore_self_update_rls.sql
          </code>{' '}
          (or add <code className="text-gray-200">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
          on Vercel for server routes). &quot;Grant admin&quot; needs{' '}
          <code className="text-gray-200">ALLOW_ADMIN_DEBUG_GRANT=1</code> on the
          server outside local dev.
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
            disabled={proLoading}
            onClick={() => void handleSetPro()}
            className="rounded border border-amber-600/80 bg-amber-950/40 px-4 py-3 text-sm text-amber-100 hover:bg-amber-900/40 disabled:opacity-50 disabled:cursor-wait"
          >
            {proLoading
              ? 'Setting Pro trial…'
              : 'Set current user as Pro trial (testing only)'}
          </button>
          {proMessage ? (
            <p
              className={
                proMessage.includes('✅')
                  ? 'text-xs whitespace-pre-wrap text-emerald-400'
                  : 'text-xs whitespace-pre-wrap text-red-400'
              }
            >
              {proMessage}
            </p>
          ) : null}
          <button
            type="button"
            disabled={adminLoading}
            onClick={() => void handleGrantAdmin()}
            className="mt-4 block w-full max-w-md rounded border border-slate-500/80 bg-slate-900/50 px-4 py-3 text-left text-sm text-slate-100 hover:bg-slate-800/50 disabled:cursor-wait disabled:opacity-50"
          >
            {adminLoading
              ? 'Granting admin…'
              : 'Grant admin to current user (testing only)'}
          </button>
          {adminMessage ? (
            <p
              className={
                adminMessage.includes('✅')
                  ? 'text-xs whitespace-pre-wrap text-emerald-400'
                  : 'text-xs whitespace-pre-wrap text-red-400'
              }
            >
              {adminMessage}
            </p>
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
    </AppPageChrome>
  )
}
