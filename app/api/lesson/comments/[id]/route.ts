import { NextResponse } from 'next/server'
import { resolveUserSupabase } from '@/lib/supabaseRouteUser'

export const runtime = 'nodejs'

const MAX_CONTENT = 4000

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

/** PATCH — edit own comment. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { user, supabase: supabaseUser } = await resolveUserSupabase(request)
  if (!user?.id || !supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const contentRaw =
    typeof body === 'object' && body !== null && 'content' in body
      ? String((body as { content: unknown }).content).trim()
      : ''
  if (!contentRaw) return NextResponse.json({ error: 'content is required' }, { status: 400 })
  if (contentRaw.length > MAX_CONTENT) {
    return NextResponse.json({ error: `content must be at most ${MAX_CONTENT} characters` }, { status: 400 })
  }

  const { data, error } = await supabaseUser
    .from('lesson_comments')
    .update({ content: contentRaw })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, lesson_id, parent_comment_id, content, likes_count, created_at, updated_at')
    .maybeSingle()

  if (error) {
    console.error('lesson comments PATCH:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Comment not found or not owned by you' }, { status: 404 })
  }

  return NextResponse.json({ comment: data })
}

/** DELETE — remove own comment (replies cascade in DB). */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { user, supabase: supabaseUser } = await resolveUserSupabase(request)
  if (!user?.id || !supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: deleted, error } = await supabaseUser
    .from('lesson_comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    console.error('lesson comments DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!deleted?.length) {
    return NextResponse.json({ error: 'Comment not found or not owned by you' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
