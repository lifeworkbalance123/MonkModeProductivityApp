import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ModStatus = 'pending' | 'reviewed'

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { id } = await ctx.params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid comment id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rec = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const raw =
    typeof rec.moderationStatus === 'string'
      ? rec.moderationStatus
      : typeof rec.status === 'string'
        ? rec.status
        : ''
  const next = raw.trim().toLowerCase() as ModStatus
  if (next !== 'pending' && next !== 'reviewed') {
    return NextResponse.json(
      { error: 'moderationStatus must be "pending" or "reviewed"' },
      { status: 400 },
    )
  }

  const { data: updated, error } = await admin
    .from('lesson_comments')
    .update({ moderation_status: next })
    .eq('id', id)
    .select('id, moderation_status')
    .maybeSingle()

  if (error) {
    console.error('admin comments PATCH:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json({ error: 'Comment not found or not updated' }, { status: 404 })
  }

  const saved = (updated as { moderation_status?: string }).moderation_status
  if (saved !== next) {
    return NextResponse.json(
      { error: 'Moderation status did not persist (check DB column and Supabase schema cache).' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { ok: true, moderationStatus: next },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
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
    return NextResponse.json({ error: 'Invalid comment id' }, { status: 400 })
  }

  const { error } = await admin.from('lesson_comments').delete().eq('id', id)

  if (error) {
    console.error('admin comments DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
