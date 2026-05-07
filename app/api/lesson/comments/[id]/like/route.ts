import { NextResponse } from 'next/server'
import { resolveUserSupabase } from '@/lib/supabaseRouteUser'

export const runtime = 'nodejs'

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

type LikeAction = 'like' | 'unlike'

/**
 * POST — like or unlike a comment (cookies or Bearer).
 * Body: `{ action: 'like' | 'unlike' }`. If `action` is omitted, toggles like state (back-compat).
 *
 * `lesson_comments.likes_count` is updated by DB triggers on `comment_likes` insert/delete
 * (`sync_lesson_comment_likes_count`); do not call separate increment/decrement RPCs.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await ctx.params
  if (!commentId || !isUuid(commentId)) {
    return NextResponse.json({ error: 'Invalid comment id' }, { status: 400 })
  }

  const { user, supabase } = await resolveUserSupabase(request)
  if (!user?.id || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let action: LikeAction | null = null
  const body = (await request.json().catch(() => ({}))) as { action?: unknown }
  if (body.action === 'like' || body.action === 'unlike') {
    action = body.action
  }

  if (action === null) {
    const { data: existing, error: selErr } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (selErr) {
      console.error('comment like select:', selErr)
      return NextResponse.json({ error: selErr.message }, { status: 500 })
    }

    if (existing) {
      const { error: delErr } = await supabase.from('comment_likes').delete().eq('id', existing.id)
      if (delErr) {
        console.error('comment like delete:', delErr)
        return NextResponse.json({ error: delErr.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, liked: false })
    }

    const { error: insErr } = await supabase.from('comment_likes').insert({
      user_id: user.id,
      comment_id: commentId,
    })

    if (insErr) {
      if (insErr.code === '23503') {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
      console.error('comment like insert:', insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, liked: true })
  }

  if (action === 'like') {
    const { error: insErr } = await supabase.from('comment_likes').insert({
      user_id: user.id,
      comment_id: commentId,
    })
    if (insErr) {
      if (insErr.code === '23505') {
        return NextResponse.json({ success: true, liked: true })
      }
      if (insErr.code === '23503') {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
      console.error('comment like insert:', insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, liked: true })
  }

  const { error: delErr } = await supabase
    .from('comment_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('comment_id', commentId)

  if (delErr) {
    console.error('comment like delete:', delErr)
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, liked: false })
}
