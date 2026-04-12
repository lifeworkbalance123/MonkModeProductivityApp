'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('body, active')
        .eq('id', 1)
        .maybeSingle()

      if (cancelled || error || !data) return
      const row = data as { body?: string; active?: boolean }
      if (row.active && row.body?.trim()) {
        setAnnouncement(row.body.trim())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!announcement || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-600 bg-amber-950/50 px-4 py-2.5 text-sm text-amber-50">
      <span className="min-w-0 flex-1">📢 {announcement}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-amber-100 hover:bg-amber-900/40"
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </div>
  )
}
