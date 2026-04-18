import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PROGRAM_TYPES = new Set([
  'sprint_standard',
  'sprint_monk',
  'transform',
  'mastery',
])

type Row = {
  program_type: string
  program_day: number
  title: string
  content_markdown: string
  phase?: number
  audio_url?: string | null
  video_url?: string | null
  tip_topic?: string | null
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  let body: { rows?: Row[] }
  try {
    body = (await request.json()) as { rows?: Row[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rows = body.rows ?? []
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'rows[] required' }, { status: 400 })
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'Max 500 rows per import' }, { status: 400 })
  }

  let inserted = 0
  let failed = 0
  const errors: string[] = []

  for (const r of rows) {
    if (!PROGRAM_TYPES.has(r.program_type)) {
      failed++
      errors.push(`skip invalid program_type: ${r.program_type}`)
      continue
    }
    const day = Number(r.program_day)
    if (!Number.isFinite(day) || day < 1) {
      failed++
      errors.push('skip invalid program_day')
      continue
    }
    const title = String(r.title ?? '').trim()
    const md = String(r.content_markdown ?? '').trim()
    if (!title || !md) {
      failed++
      continue
    }

    const payload = {
      program_type: r.program_type,
      program_day: Math.floor(day),
      phase: Math.max(1, Math.floor(r.phase ?? 1) || 1),
      title,
      content_markdown: md,
      audio_url: r.audio_url ? String(r.audio_url) : null,
      video_url: r.video_url ? String(r.video_url) : null,
      tip_topic: r.tip_topic ? String(r.tip_topic) : null,
    }

    const { error } = await admin.from('daily_lessons').upsert(payload, {
      onConflict: 'program_type,program_day',
    })

    if (error) {
      failed++
      errors.push(error.message)
    } else {
      inserted++
    }
  }

  return NextResponse.json({ ok: true, inserted, failed, errors: errors.slice(0, 20) })
}
