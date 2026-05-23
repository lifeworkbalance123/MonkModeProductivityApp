'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ContentManagerHeader, ContentManagerTabs } from '@/components/admin/ContentManagerTabs'
import type { DailyQuoteRow } from '@/lib/dailyQuotes'

type QuoteForm = {
  day_number: string
  quote_text: string
  author: string
  active: boolean
}

const emptyForm = (): QuoteForm => ({
  day_number: '',
  quote_text: '',
  author: '',
  active: true,
})

async function adminAuthHeaders(): Promise<Record<string, string> | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<DailyQuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuoteForm>(emptyForm())

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await adminAuthHeaders()
      if (!headers) {
        setError('Not signed in')
        setQuotes([])
        return
      }
      const res = await fetch('/api/admin/quotes', { headers, cache: 'no-store' })
      const json = (await res.json().catch(() => ({}))) as {
        quotes?: DailyQuoteRow[]
        error?: string
      }
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`)
        setQuotes([])
        return
      }
      setQuotes(json.quotes ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchQuotes()
  }, [fetchQuotes])

  const handleSave = async () => {
    const day = Number.parseInt(form.day_number, 10)
    if (!Number.isFinite(day) || day < 1 || day > 60) {
      setError('Day number must be between 1 and 60')
      return
    }
    if (!form.quote_text.trim()) {
      setError('Quote text is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const headers = await adminAuthHeaders()
      if (!headers) {
        setError('Not signed in')
        return
      }
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          day_number: day,
          quote_text: form.quote_text.trim(),
          author: form.author.trim() || null,
          active: form.active,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(json.error ?? `Save failed (${res.status})`)
        return
      }
      setEditingId(null)
      setForm(emptyForm())
      await fetchQuotes()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quote slot?')) return
    setError(null)
    const headers = await adminAuthHeaders()
    if (!headers) {
      setError('Not signed in')
      return
    }
    const res = await fetch(`/api/admin/quotes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      setError(json.error ?? `Delete failed (${res.status})`)
      return
    }
    if (editingId === id) {
      setEditingId(null)
      setForm(emptyForm())
    }
    await fetchQuotes()
  }

  const filledDays = new Set(quotes.map((q) => q.day_number))

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading quotes…</div>
    )
  }

  return (
    <div className="p-6">
      <ContentManagerHeader />
      <ContentManagerTabs activeSection="quotes" />

      <p className="mb-6 text-sm text-muted-foreground">
        60 slots (days 1–60). Program day 61+ cycles back to slot 1. Shown on the dashboard morning
        motivation section.
      </p>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold text-foreground">
          {editingId ? 'Edit quote' : 'Add or update quote'}
        </h2>
        <div className="grid max-w-xl gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Day slot (1–60)</label>
            <input
              type="number"
              min={1}
              max={60}
              placeholder="Day number (1–60)"
              value={form.day_number}
              onChange={(e) => setForm({ ...form, day_number: e.target.value })}
              className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Quote</label>
            <textarea
              placeholder="Quote text"
              value={form.quote_text}
              onChange={(e) => setForm({ ...form, quote_text: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Author (optional)</label>
            <input
              placeholder="Author"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active (visible on dashboard)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm())
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {filledDays.size}/60 slots filled. Saving the same day number updates that slot.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="p-3 font-medium">Day</th>
              <th className="p-3 font-medium">Quote</th>
              <th className="p-3 font-medium">Author</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-muted-foreground">
                  No quotes yet. Run the database migration or add quotes above.
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="border-b border-border/60">
                  <td className="p-3 font-medium text-foreground">{q.day_number}</td>
                  <td className="max-w-md p-3 text-foreground">{q.quote_text}</td>
                  <td className="p-3 text-muted-foreground">{q.author ?? '—'}</td>
                  <td className="p-3">{q.active ? 'Yes' : 'No'}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(q.id)
                        setForm({
                          day_number: String(q.day_number),
                          quote_text: q.quote_text,
                          author: q.author ?? '',
                          active: q.active,
                        })
                      }}
                      className="mr-3 text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(q.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
