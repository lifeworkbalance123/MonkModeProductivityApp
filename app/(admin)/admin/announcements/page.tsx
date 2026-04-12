'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminAnnouncementsPage() {
  const [bodyText, setBodyText] = useState('')
  const [active, setActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('body, active')
        .eq('id', 1)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        setLoadError(error.message)
        return
      }
      if (data) {
        setBodyText((data as { body?: string }).body ?? '')
        setActive(Boolean((data as { active?: boolean }).active))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function saveAnnouncement() {
    setSaving(true)
    setLoadError(null)
    try {
      const { error } = await supabase.from('announcements').upsert(
        {
          id: 1,
          body: bodyText,
          active,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      if (error) throw error
      setSaved(true)
      window.setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed'
      setLoadError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-white">Announcements</h1>
      <p className="mt-2 text-sm text-slate-500">
        Global banner text (single row <code className="text-slate-400">id=1</code>).
      </p>

      {loadError ? (
        <p className="mt-4 text-sm text-red-400">{loadError}</p>
      ) : null}

      <div className="mt-8 rounded-xl border border-slate-700 bg-[#1E293B] p-6">
        <label className="mb-2 block text-[13px] text-slate-400">
          Announcement message
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="e.g. New feature: Deep Work is live."
          rows={4}
          className="box-border w-full resize-y rounded-lg border border-slate-600 bg-[#0F172A] p-3 text-sm text-white outline-none placeholder:text-slate-600"
        />

        <label className="mt-4 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-sm text-slate-300">
            Show this announcement to all signed-in users
          </span>
        </label>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveAnnouncement()}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save announcement'}
          </button>
          {saved ? (
            <span className="text-sm text-emerald-400">✓ Saved</span>
          ) : null}
        </div>
      </div>

      {bodyText ? (
        <div className="mt-8">
          <p className="mb-2 text-[13px] text-slate-500">Preview</p>
          <div className="rounded-lg border border-amber-600 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            📢 {bodyText}
          </div>
        </div>
      ) : null}
    </div>
  )
}
