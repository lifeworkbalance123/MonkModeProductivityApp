'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Lesson = {
  id: string
  program_type: string
  program_day: number
  title: string
  tip_topic: string | null
  audio_url: string | null
}

export default function LessonList() {
  const [programType, setProgramType] = useState('all')
  const [rows, setRows] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [csvBusy, setCsvBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setLoading(false)
      return
    }
    const params = new URLSearchParams({ page: '1', pageSize: '200' })
    if (programType !== 'all') params.set('programType', programType)
    const res = await fetch(`/api/admin/lessons?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const json = (await res.json()) as { lessons?: Lesson[]; error?: string }
    if (!res.ok) {
      setMessage(json.error ?? 'Failed to load')
      setRows([])
    } else {
      setMessage('')
      setRows((json.lessons as Lesson[]) ?? [])
    }
    setLoading(false)
  }, [programType])

  useEffect(() => {
    void load()
  }, [load])

  async function onCsv(file: File | null) {
    if (!file) return
    setCsvBusy(true)
    setMessage('')
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      setMessage('CSV needs a header row and at least one data row')
      setCsvBusy(false)
      return
    }
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const idx = (name: string) => header.indexOf(name)
    const rowsParsed: Record<string, unknown>[] = []
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i])
      const row: Record<string, unknown> = {}
      const pt = cells[idx('program_type')]
      const pd = cells[idx('program_day')]
      const title = cells[idx('title')]
      const md = cells[idx('content_markdown')]
      if (!pt || !pd || !title || md === undefined) continue
      row.program_type = pt
      row.program_day = Number(pd)
      row.title = title
      row.content_markdown = md
      const ph = idx('phase')
      if (ph >= 0 && cells[ph]) row.phase = Number(cells[ph])
      const au = idx('audio_url')
      if (au >= 0) row.audio_url = cells[au] || null
      const vu = idx('video_url')
      if (vu >= 0) row.video_url = cells[vu] || null
      const tt = idx('tip_topic')
      if (tt >= 0) row.tip_topic = cells[tt] || null
      const ib = idx('is_bonus')
      if (ib >= 0 && cells[ib] !== undefined && String(cells[ib]).trim() !== '') {
        row.is_bonus = cells[ib]
      }
      rowsParsed.push(row)
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setCsvBusy(false)
      return
    }
    const res = await fetch('/api/admin/lessons/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rows: rowsParsed }),
    })
    const json = (await res.json()) as { inserted?: number; failed?: number; errors?: string[]; error?: string }
    setCsvBusy(false)
    if (!res.ok) {
      setMessage(json.error ?? 'Import failed')
      return
    }
    setMessage(
      `Imported ${json.inserted ?? 0} rows${json.failed ? `, ${json.failed} failed` : ''}`,
    )
    void load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Program-track lessons live in <code className="text-xs">daily_lessons</code>. CSV columns:{' '}
        <code className="text-xs">
          program_type, program_day, title, content_markdown, phase, audio_url, video_url, tip_topic, is_bonus
        </code>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">
          Filter
          <select
            className="ml-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm"
            value={programType}
            onChange={(e) => setProgramType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="sprint_standard">Sprint</option>
            <option value="sprint_monk">Monk Mode</option>
            <option value="transform">Transform</option>
            <option value="mastery">Mastery</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Bulk CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="ml-2 text-xs"
            disabled={csvBusy}
            onChange={(e) => void onCsv(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {message ? <p className="text-sm text-foreground">{message}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Audio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-3 py-2">{r.program_day}</td>
                  <td className="px-3 py-2 font-medium">{r.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.tip_topic ?? '—'}</td>
                  <td className="px-3 py-2">{r.audio_url ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/** Minimal CSV line split (handles quoted fields lightly). */
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      q = !q
      continue
    }
    if (!q && c === ',') {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}
