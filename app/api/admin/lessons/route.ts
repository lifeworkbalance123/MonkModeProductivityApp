import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

const PROGRAM_TYPES = new Set([
  'sprint_standard',
  'sprint_monk',
  'transform',
  'mastery',
])

function parseIntParam(v: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { searchParams } = new URL(request.url)
  const page = parseIntParam(searchParams.get('page'), 1, 1, 5000)
  const pageSize = parseIntParam(searchParams.get('pageSize'), 50, 1, 200)
  const programType = (searchParams.get('programType') ?? '').trim()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = admin
    .from('daily_lessons')
    .select('*', { count: 'exact' })
    .order('program_type', { ascending: true })
    .order('program_day', { ascending: true })
    .order('is_bonus', { ascending: true })

  if (programType && programType !== 'all') {
    q = q.eq('program_type', programType)
  }

  const { data, error, count } = await q.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    page,
    pageSize,
    total: count ?? 0,
    lessons: data ?? [],
  })
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const program_type = String(body.program_type ?? '')
  const program_day = Number(body.program_day)
  const title = String(body.title ?? '').trim()
  const content_markdown = String(body.content_markdown ?? '')
  const phase = Number(body.phase ?? 1)

  if (!PROGRAM_TYPES.has(program_type)) {
    return NextResponse.json({ error: 'Invalid program_type' }, { status: 400 })
  }
  if (!Number.isFinite(program_day) || program_day < 1) {
    return NextResponse.json({ error: 'Invalid program_day' }, { status: 400 })
  }
  if (!title || !content_markdown.trim()) {
    return NextResponse.json({ error: 'title and content_markdown required' }, { status: 400 })
  }

  const is_bonus =
    body.is_bonus === true || body.is_bonus === 'true' || body.is_bonus === 1 || body.is_bonus === '1'
  const dayFloor = Math.floor(program_day)
  const payload = {
    program_type,
    program_day: dayFloor,
    is_bonus,
    parent_day_number: is_bonus ? dayFloor : null,
    phase: Math.max(1, Math.floor(phase) || 1),
    title,
    content_markdown,
    audio_url: body.audio_url ? String(body.audio_url) : null,
    video_url: body.video_url ? String(body.video_url) : null,
    tip_topic: body.tip_topic ? String(body.tip_topic) : null,
  }

  const { data, error } = await admin.from('daily_lessons').insert(payload).select('id').maybeSingle()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate program_type + program_day + is_bonus' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: (data as { id?: string })?.id })
}
