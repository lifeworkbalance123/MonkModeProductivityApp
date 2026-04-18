'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TYPES = ['sprint_standard', 'sprint_monk', 'transform', 'mastery'] as const

/**
 * Minimal create form for `daily_lessons` (full editing remains in Program tracks tab).
 */
export function LessonForm({ onCreated }: { onCreated?: () => void }) {
  const [program_type, setProgramType] = useState<(typeof TYPES)[number]>('sprint_standard')
  const [program_day, setProgramDay] = useState(1)
  const [phase, setPhase] = useState(1)
  const [title, setTitle] = useState('')
  const [content_markdown, setContentMarkdown] = useState('')
  const [tip_topic, setTipTopic] = useState('')
  const [audio_url, setAudioUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit() {
    setBusy(true)
    setMsg('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setBusy(false)
      return
    }
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        program_type,
        program_day,
        phase,
        title,
        content_markdown,
        tip_topic: tip_topic || null,
        audio_url: audio_url || null,
      }),
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (!res.ok) {
      setMsg(json.error ?? 'Save failed')
      return
    }
    setMsg('Saved')
    onCreated?.()
  }

  return (
    <div className="max-w-xl space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">Quick create lesson</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Program type</Label>
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
            value={program_type}
            onChange={(e) => setProgramType(e.target.value as (typeof TYPES)[number])}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Program day</Label>
          <Input
            type="number"
            min={1}
            className="mt-1"
            value={program_day}
            onChange={(e) => setProgramDay(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Phase</Label>
        <Input
          type="number"
          min={1}
          className="mt-1 w-24"
          value={phase}
          onChange={(e) => setPhase(Number(e.target.value))}
        />
      </div>
      <div>
        <Label className="text-xs">Title</Label>
        <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Markdown content</Label>
        <textarea
          className="mt-1 min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={content_markdown}
          onChange={(e) => setContentMarkdown(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Tip topic</Label>
        <Input className="mt-1" value={tip_topic} onChange={(e) => setTipTopic(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Audio URL</Label>
        <Input className="mt-1" value={audio_url} onChange={(e) => setAudioUrl(e.target.value)} />
      </div>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      <Button type="button" size="sm" disabled={busy} onClick={() => void submit()}>
        {busy ? 'Saving…' : 'Create'}
      </Button>
    </div>
  )
}
