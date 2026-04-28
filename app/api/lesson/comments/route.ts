import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { resolveUserSupabase } from '@/lib/supabaseRouteUser'

export const runtime = 'nodejs'

const MAX_CONTENT = 4000

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

/**
 * GET — list comments for a lesson (public).
 *
 * Viewer for `likedByMe`: `Authorization: Bearer <jwt>` if present, otherwise the
 * Supabase session from cookies (`createServerSupabaseClient`), matching how other
 * routes use the session without `@supabase/auth-helpers-nextjs`.
 *
 * We use the service role to read `users.display_name` for all authors: embedding
 * `user:users(...)` on the anon/session client would be blocked by RLS on `public.users`
 * (select own row only). We also fetch a flat list so arbitrarily deep reply threads work;
 * a nested `replies:lesson_comments(...)` select only returns one level.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const lessonId = (url.searchParams.get('lessonId') ?? '').trim()
  if (!lessonId || !isUuid(lessonId)) {
    return NextResponse.json({ error: 'lessonId (uuid) is required' }, { status: 400 })
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const { data: rows, error } = await admin
    .from('lesson_comments')
    .select('id, user_id, lesson_id, parent_comment_id, content, likes_count, created_at, updated_at')
    .eq('lesson_id', lessonId)
    .eq('moderation_status', 'reviewed')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('lesson comments GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const comments = rows ?? []
  const userIds = [...new Set(comments.map((c) => c.user_id as string))]
  let nameByUser = new Map<string, string | null>()
  if (userIds.length) {
    const { data: users, error: uerr } = await admin
      .from('users')
      .select('id, display_name')
      .in('id', userIds)
    if (!uerr && users) {
      nameByUser = new Map(users.map((u) => [u.id as string, (u.display_name as string | null) ?? null]))
    }
  }

  const { user: viewer } = await resolveUserSupabase(request)
  const viewerId = viewer?.id ?? null

  let likedIds = new Set<string>()
  if (viewerId && comments.length) {
    const ids = comments.map((c) => c.id as string)
    const { data: likes } = await admin
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', viewerId)
      .in('comment_id', ids)
    likedIds = new Set((likes ?? []).map((l) => l.comment_id as string))
  }

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      userId: c.user_id,
      lessonId: c.lesson_id,
      parentCommentId: c.parent_comment_id,
      content: c.content,
      likesCount: c.likes_count,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      authorDisplayName: nameByUser.get(c.user_id as string) ?? null,
      likedByMe: likedIds.has(c.id as string),
    })),
  })
}

/** POST — new comment or reply (authenticated via cookies or Bearer). */
export async function POST(request: Request) {
  const { user, supabase } = await resolveUserSupabase(request)
  if (!user?.id || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const lessonId = typeof b.lessonId === 'string' ? b.lessonId.trim() : ''
  const contentRaw = typeof b.content === 'string' ? b.content.trim() : ''
  const parentCommentId =
    typeof b.parentCommentId === 'string' && b.parentCommentId.trim()
      ? b.parentCommentId.trim()
      : null

  if (!lessonId || !isUuid(lessonId) || !contentRaw) {
    return NextResponse.json({ error: 'lessonId and content required' }, { status: 400 })
  }
  if (contentRaw.length > MAX_CONTENT) {
    return NextResponse.json({ error: `content must be at most ${MAX_CONTENT} characters` }, { status: 400 })
  }

  if (parentCommentId) {
    if (!isUuid(parentCommentId)) {
      return NextResponse.json({ error: 'parentCommentId must be a uuid' }, { status: 400 })
    }
    const { data: parent, error: perr } = await supabase
      .from('lesson_comments')
      .select('id, lesson_id')
      .eq('id', parentCommentId)
      .maybeSingle()
    if (perr || !parent) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 })
    }
    if ((parent as { lesson_id: string }).lesson_id !== lessonId) {
      return NextResponse.json({ error: 'Parent comment belongs to a different lesson' }, { status: 400 })
    }
  }

  const { data: lesson, error: lerr } = await supabase
    .from('daily_lessons')
    .select('id')
    .eq('id', lessonId)
    .maybeSingle()
  if (lerr || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const { data: inserted, error: insErr } = await supabase
    .from('lesson_comments')
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      parent_comment_id: parentCommentId || null,
      content: contentRaw,
      moderation_status: 'pending',
    })
    .select()
    .single()

  if (insErr) {
    console.error('lesson comments POST:', insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ comment: inserted })
}
