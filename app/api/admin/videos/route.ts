import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isValidHttpUrl } from '@/lib/trainingVideos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function verifyAdmin(request: Request) {
  const admin = createServiceRoleClient()
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { admin, ok: false as const, status: 401 }

  const { data: userData } = await admin.auth.getUser(token)
  const user = userData.user
  if (!user) return { admin, ok: false as const, status: 401 }

  const { data: selfRow } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!(selfRow as { is_admin?: boolean } | null)?.is_admin) {
    return { admin, ok: false as const, status: 403 }
  }
  return { admin, ok: true as const, status: 200 }
}

function parseBody(body: unknown): {
  title?: string
  description?: string | null
  video_url?: string
  category?: string
  sort_order?: number
  id?: string
} {
  if (!body || typeof body !== 'object') return {}
  const o = body as Record<string, unknown>
  return {
    id: typeof o.id === 'string' ? o.id : undefined,
    title: typeof o.title === 'string' ? o.title : undefined,
    description: typeof o.description === 'string' ? o.description : o.description === null ? null : undefined,
    video_url: typeof o.video_url === 'string' ? o.video_url : undefined,
    category: typeof o.category === 'string' ? o.category : undefined,
    sort_order: typeof o.sort_order === 'number' && Number.isFinite(o.sort_order) ? o.sort_order : undefined,
  }
}

/** Create a catalog video (admin only). */
export async function POST(request: Request) {
  let verified
  try {
    verified = await verifyAdmin(request)
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: verified.status },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const p = parseBody(body)
  const title = (p.title ?? '').trim()
  const video_url = (p.video_url ?? '').trim()
  const category = (p.category ?? 'General').trim() || 'General'
  const description =
    p.description === undefined || p.description === null
      ? null
      : String(p.description).trim() || null
  const sort_order = p.sort_order ?? 0

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!isValidHttpUrl(video_url)) return NextResponse.json({ error: 'video_url must be a valid http(s) URL' }, { status: 400 })

  const now = new Date().toISOString()
  const { data, error } = await verified.admin
    .from('training_videos')
    .insert({
      title,
      description,
      video_url,
      category,
      sort_order,
      created_at: now,
      updated_at: now,
    })
    .select('id, title, description, video_url, category, sort_order, created_at, updated_at')
    .single()

  if (error) {
    console.error('admin videos POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ video: data })
}

/** Update a catalog video (admin only). */
export async function PUT(request: Request) {
  let verified
  try {
    verified = await verifyAdmin(request)
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: verified.status },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const p = parseBody(body)
  const id = (p.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const title = p.title !== undefined ? String(p.title).trim() : undefined
  const video_url = p.video_url !== undefined ? String(p.video_url).trim() : undefined
  const category = p.category !== undefined ? String(p.category).trim() || 'General' : undefined
  const description =
    p.description === undefined
      ? undefined
      : p.description === null
        ? null
        : String(p.description).trim() || null
  const sort_order = p.sort_order

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) {
    if (!title) return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
    patch.title = title
  }
  if (video_url !== undefined) {
    if (!isValidHttpUrl(video_url)) {
      return NextResponse.json({ error: 'video_url must be a valid http(s) URL' }, { status: 400 })
    }
    patch.video_url = video_url
  }
  if (category !== undefined) patch.category = category
  if (description !== undefined) patch.description = description
  if (sort_order !== undefined) patch.sort_order = sort_order

  const { data, error } = await verified.admin
    .from('training_videos')
    .update(patch)
    .eq('id', id)
    .select('id, title, description, video_url, category, sort_order, created_at, updated_at')
    .maybeSingle()

  if (error) {
    console.error('admin videos PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ video: data })
}

/** Delete a catalog video (admin only). */
export async function DELETE(request: Request) {
  let verified
  try {
    verified = await verifyAdmin(request)
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: verified.status },
    )
  }

  const url = new URL(request.url)
  const id = (url.searchParams.get('id') ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 })

  const { data, error } = await verified.admin.from('training_videos').delete().eq('id', id).select('id').maybeSingle()

  if (error) {
    console.error('admin videos DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
