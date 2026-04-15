'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type WaitlistRow = {
  email: string
  created_at: string
  source: string | null
  notified: boolean
}

export default function AdminWaitlistPage() {
  const [rows, setRows] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Not signed in')
        setLoading(false)
        return
      }
      const res = await fetch('/api/admin/waitlist', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json().catch(() => ({}))) as {
        rows?: WaitlistRow[]
        error?: string
      }
      if (cancelled) return
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`)
        setRows([])
      } else {
        setError(null)
        setRows(json.rows ?? [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function downloadCsv() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    const res = await fetch('/api/admin/waitlist-export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'waitlist-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Waitlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} row{rows.length === 1 ? '' : 's'} loaded
          </p>
        </div>
        <button
          type="button"
          onClick={() => void downloadCsv()}
          className="self-start rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          Download CSV
        </button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {['Email', 'Source', 'Notified', 'Signed up'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.email} className="border-b border-border">
                    <td className="px-5 py-3 text-muted-foreground">{r.email}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.source ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.notified ? 'Yes' : 'No'}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
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
