import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  const page = parseIntParam(searchParams.get('page'), 1, 1, 10_000)
  const pageSize = parseIntParam(searchParams.get('pageSize'), 30, 1, 100)
  const q = (searchParams.get('q') ?? '').trim()
  const rawStatus = (searchParams.get('status') ?? 'all').trim().toLowerCase()
  const statusFilter =
    rawStatus === 'pending' || rawStatus === 'reviewed' ? rawStatus : 'all'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let qb = admin
    .from('lesson_comments')
    .select(
      'id, user_id, lesson_id, parent_comment_id, content, likes_count, created_at, updated_at, moderation_status',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    qb = qb.eq('moderation_status', statusFilter)
  }

  if (q) {
    qb = qb.ilike('content', `%${q}%`)
  }

  const { data: rows, error, count } = await qb.range(from, to)

  if (error) {
    console.error('admin comments GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const comments = rows ?? []
  const userIds = [...new Set(comments.map((c) => c.user_id as string))]
  const lessonIds = [...new Set(comments.map((c) => c.lesson_id as string))]

  const [usersRes, lessonsRes] = await Promise.all([
    userIds.length
      ? admin.from('users').select('id, email, display_name').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; email: string | null; display_name: string | null }[] }),
    lessonIds.length
      ? admin
          .from('daily_lessons')
          .select('id, program_type, program_day, title')
          .in('id', lessonIds)
      : Promise.resolve({
          data: [] as {
            id: string
            program_type: string
            program_day: number
            title: string
          }[],
        }),
  ])

  const userMap = new Map(
    (usersRes.data ?? []).map((u) => [
      u.id,
      u as { id: string; email: string | null; display_name: string | null },
    ]),
  )
  const lessonMap = new Map(
    (lessonsRes.data ?? []).map((l) => [
      l.id,
      l as { id: string; program_type: string; program_day: number; title: string },
    ]),
  )

  const items = comments.map((c) => {
    const row = c as Record<string, unknown>
    const modRaw = row.moderation_status ?? row.moderationStatus
    const moderationStatus: 'pending' | 'reviewed' =
      modRaw === 'reviewed' ? 'reviewed' : 'pending'

    const u = userMap.get(c.user_id as string)
    const l = lessonMap.get(c.lesson_id as string)
    return {
      id: c.id as string,
      userId: c.user_id as string,
      lessonId: c.lesson_id as string,
      parentCommentId: (c.parent_comment_id as string | null) ?? null,
      content: c.content as string,
      likesCount: (c.likes_count as number) ?? 0,
      createdAt: c.created_at as string,
      authorEmail: u?.email ?? null,
      authorDisplayName: u?.display_name ?? null,
      lessonProgramType: l?.program_type ?? null,
      lessonDay: l?.program_day ?? null,
      lessonTitle: l?.title ?? null,
      moderationStatus,
    }
  })

  return NextResponse.json(
    {
      items,
      total: count ?? 0,
      page,
      pageSize,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
