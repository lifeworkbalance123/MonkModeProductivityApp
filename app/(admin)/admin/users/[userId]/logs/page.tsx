'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LogRow = Record<string, unknown>

export default function AdminUserLogsPage() {
  const params = useParams()
  const userId = typeof params.userId === 'string' ? params.userId : ''
  const [logs, setLogs] = useState<LogRow[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setError('No session')
      setLoading(false)
      return
    }
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/logs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const json = (await res.json()) as { logs?: LogRow[]; email?: string | null; error?: string }
    if (!res.ok) {
      setError(json.error ?? 'Failed to load')
      setLogs([])
    } else {
      setLogs(json.logs ?? [])
      setEmail(json.email ?? null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const cols = logs[0] ? Object.keys(logs[0]) : []

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          ← Users
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Daily logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {email ?? userId}
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-border">
                {cols.map((c) => (
                  <th key={c} className="px-2 py-2 font-medium text-muted-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  {cols.map((c) => (
                    <td key={c} className="max-w-[240px] whitespace-pre-wrap break-words px-2 py-1.5">
                      {formatCell(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatCell(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
