'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

type FilterTab = 'all' | 'pending' | 'reviewed'

type CommentRow = {
  id: string
  userId: string
  lessonId: string
  parentCommentId: string | null
  content: string
  likesCount: number
  createdAt: string
  authorEmail: string | null
  authorDisplayName: string | null
  lessonProgramType: string | null
  lessonDay: number | null
  lessonTitle: string | null
  moderationStatus: 'pending' | 'reviewed'
}

/** API must send moderationStatus; if missing (stale cache), avoid mislabeling as Reviewed. */
function rowModeration(row: CommentRow): 'pending' | 'reviewed' {
  return row.moderationStatus === 'reviewed' ? 'reviewed' : 'pending'
}

export default function AdminCommentsPage() {
  const [items, setItems] = useState<CommentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [q, setQ] = useState('')
  const [qSubmitted, setQSubmitted] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const pageSize = 30

  const load = useCallback(
    async (p: number, search: string, status: FilterTab) => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setError('Not signed in')
          setItems([])
          return
        }
        const sp = new URLSearchParams({
          page: String(p),
          pageSize: String(pageSize),
        })
        if (search.trim()) sp.set('q', search.trim())
        if (status !== 'all') sp.set('status', status)
        const res = await fetch(`/api/admin/comments?${sp}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const json = (await res.json().catch(() => ({}))) as {
          items?: CommentRow[]
          total?: number
          error?: string
        }
        if (!res.ok) {
          setError(json.error ?? `HTTP ${res.status}`)
          setItems([])
          setTotal(0)
          return
        }
        setItems(json.items ?? [])
        setTotal(json.total ?? 0)
      } finally {
        setLoading(false)
      }
    },
    [pageSize],
  )

  useEffect(() => {
    void load(page, qSubmitted, filterTab)
  }, [load, page, qSubmitted, filterTab])

  async function removeComment(id: string) {
    if (!confirm('Delete this comment? Replies are removed automatically.')) return
    setDeletingId(id)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        alert(json.error ?? `Delete failed (${res.status})`)
        return
      }
      void load(page, qSubmitted, filterTab)
    } finally {
      setDeletingId(null)
    }
  }

  async function setModeration(id: string, moderationStatus: 'pending' | 'reviewed') {
    setUpdatingId(id)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({ moderationStatus }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        alert(json.error ?? `Update failed (${res.status})`)
        return
      }
      void load(page, qSubmitted, filterTab)
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const filterDescription =
    filterTab === 'all'
      ? 'all statuses'
      : filterTab === 'pending'
        ? 'pending review'
        : 'reviewed'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Lesson comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate discussion on daily lessons ({total} {filterDescription}
          {qSubmitted ? ` matching “${qSubmitted}”` : ''}).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['all', 'All'],
            ['pending', 'Pending'],
            ['reviewed', 'Reviewed'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilterTab(value)
              setPage(1)
            }}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              filterTab === value
                ? 'border-accent bg-accent/15 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQSubmitted(q)
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="comment-search" className="text-xs font-medium text-muted-foreground">
            Search in comment text
          </label>
          <input
            id="comment-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keyword…"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Search
        </button>
      </form>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No comments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {['When', 'Status', 'Author', 'Lesson', 'Comment', 'Likes', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border align-top">
                    <td className="max-w-[140px] px-4 py-3 text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString('en-AU')}
                    </td>
                    <td className="max-w-[100px] px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded px-2 py-0.5 text-[11px] font-medium',
                          rowModeration(row) === 'pending'
                            ? 'bg-amber-500/20 text-amber-200'
                            : 'bg-emerald-500/15 text-emerald-200',
                        )}
                      >
                        {rowModeration(row) === 'reviewed' ? 'Reviewed' : 'Pending'}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <div className="break-all text-foreground">
                        {row.authorDisplayName ?? row.authorEmail ?? row.userId.slice(0, 8)}
                      </div>
                      {row.authorEmail ? (
                        <div className="mt-0.5 break-all text-[11px] text-muted-foreground">
                          {row.authorEmail}
                        </div>
                      ) : null}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-muted-foreground">
                      {row.lessonTitle ? (
                        <span className="text-foreground">{row.lessonTitle}</span>
                      ) : (
                        '—'
                      )}
                      <div className="mt-1 text-[11px]">
                        {row.lessonProgramType ?? '?'} · day {row.lessonDay ?? '?'}
                      </div>
                      <Link
                        href="/admin/content?tab=programLessons"
                        className="mt-1 inline-block text-[11px] text-accent underline"
                      >
                        Content editor
                      </Link>
                    </td>
                    <td className="min-w-[200px] px-4 py-3">
                      {row.parentCommentId ? (
                        <span className="mb-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Reply
                        </span>
                      ) : null}
                      <p className="whitespace-pre-wrap text-foreground">{row.content}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.likesCount}</td>
                    <td className="space-y-1 px-4 py-3">
                      {rowModeration(row) === 'pending' ? (
                        <button
                          type="button"
                          disabled={updatingId === row.id}
                          onClick={() => void setModeration(row.id, 'reviewed')}
                          className="block w-full rounded border border-emerald-500/40 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                        >
                          {updatingId === row.id ? '…' : 'Mark reviewed'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === row.id}
                          onClick={() => void setModeration(row.id, 'pending')}
                          className="block w-full rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                        >
                          {updatingId === row.id ? '…' : 'Mark pending'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={() => void removeComment(row.id)}
                        className="block w-full rounded border border-red-500/50 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deletingId === row.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
