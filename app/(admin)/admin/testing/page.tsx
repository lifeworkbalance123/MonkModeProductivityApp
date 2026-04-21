'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type ProgramType = 'sprint_standard' | 'sprint_monk' | 'transform'

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function AdminTestingPage() {
  const [programType, setProgramType] = useState<ProgramType>('sprint_standard')
  const [jumpDay, setJumpDay] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  async function callApi(path: string, body: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    try {
      const headers = await authHeaders()
      if (!headers) {
        setMessage('Sign in required')
        return
      }
      const res = await fetch(path, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) {
        setMessage(json.error ?? 'Request failed')
        return
      }
      setMessage('Success')
    } catch {
      setMessage('Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Admin Testing Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quickly test onboarding and progression without real payment.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <label className="block text-sm text-muted-foreground">
          Program
          <select
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            value={programType}
            onChange={(e) => setProgramType(e.target.value as ProgramType)}
          >
            <option value="sprint_standard">Sprint</option>
            <option value="sprint_monk">Monk Mode</option>
            <option value="transform">Transform</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            className="rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
            onClick={() =>
              void callApi('/api/admin/testing/start-program', { programType })
            }
          >
            Start Program (No Payment)
          </button>
          <button
            type="button"
            disabled={loading}
            className="rounded border border-border px-3 py-2 text-sm text-foreground disabled:opacity-60"
            onClick={() => void callApi('/api/admin/testing/reset-program', {})}
          >
            Reset Program (Keep Track)
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <label className="block text-sm text-muted-foreground">
          Jump to day
          <input
            type="number"
            min={1}
            max={365}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            value={jumpDay}
            onChange={(e) => setJumpDay(Number.parseInt(e.target.value, 10) || 1)}
          />
        </label>
        <button
          type="button"
          disabled={loading}
          className="rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
          onClick={() =>
            void callApi('/api/admin/testing/jump-to-day', { programDay: jumpDay })
          }
        >
          Jump to Day
        </button>
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
