import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PROGRAM_TYPES = new Set([
  'sprint_standard',
  'sprint_monk',
  'transform',
  'mastery',
])

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { id } = await ctx.params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const program_type = body.program_type != null ? String(body.program_type) : null
  if (program_type && !PROGRAM_TYPES.has(program_type)) {
    return NextResponse.json({ error: 'Invalid program_type' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (program_type) payload.program_type = program_type
  if (body.program_day != null) {
    const d = Number(body.program_day)
    if (!Number.isFinite(d) || d < 1) {
      return NextResponse.json({ error: 'Invalid program_day' }, { status: 400 })
    }
    payload.program_day = Math.floor(d)
  }
  if (body.title != null) payload.title = String(body.title).trim()
  if (body.content_markdown != null) payload.content_markdown = String(body.content_markdown)
  if (body.phase != null) payload.phase = Math.max(1, Math.floor(Number(body.phase)) || 1)
  if (body.audio_url !== undefined) payload.audio_url = body.audio_url ? String(body.audio_url) : null
  if (body.video_url !== undefined) payload.video_url = body.video_url ? String(body.video_url) : null
  if (body.tip_topic !== undefined) payload.tip_topic = body.tip_topic ? String(body.tip_topic) : null
  if (body.is_bonus !== undefined) {
    payload.is_bonus =
      body.is_bonus === true || body.is_bonus === 'true' || body.is_bonus === 1 || body.is_bonus === '1'
  }
  if (body.parent_day_number !== undefined) {
    const p = Number(body.parent_day_number)
    payload.parent_day_number =
      body.parent_day_number === null || body.parent_day_number === ''
        ? null
        : Number.isFinite(p) && p >= 1
          ? Math.floor(p)
          : null
  }

  const { error } = await admin.from('daily_lessons').update(payload).eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate program_type + program_day + is_bonus' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { id } = await ctx.params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { error } = await admin.from('daily_lessons').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
