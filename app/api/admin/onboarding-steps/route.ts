import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isOnboardingStepKind, type OnboardingStepKind } from '@/lib/onboardingSteps'

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

function parseKind(raw: unknown): OnboardingStepKind | null {
  if (typeof raw !== 'string') return null
  return isOnboardingStepKind(raw) ? raw : null
}

/** Create a step (admin). */
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
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

  const title = typeof o.title === 'string' ? o.title.trim() : ''
  const action_label = typeof o.action_label === 'string' ? o.action_label.trim() : 'Next'
  const description =
    typeof o.description === 'string'
      ? o.description
      : o.description === null
        ? null
        : undefined
  const video_url =
    typeof o.video_url === 'string'
      ? o.video_url.trim() || null
      : o.video_url === null
        ? null
        : undefined
  const step_kind = parseKind(o.step_kind) ?? 'content'
  let step_order =
    typeof o.step_order === 'number' && Number.isFinite(o.step_order) ? Math.floor(o.step_order) : NaN

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  if (!Number.isFinite(step_order)) {
    const { data: maxRow } = await verified.admin
      .from('onboarding_steps')
      .select('step_order')
      .order('step_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    step_order = ((maxRow as { step_order?: number } | null)?.step_order ?? -1) + 1
  }

  const now = new Date().toISOString()
  const insertRow: Record<string, unknown> = {
    step_order,
    title,
    action_label: action_label || 'Next',
    step_kind,
    created_at: now,
    updated_at: now,
  }
  if (description !== undefined) insertRow.description = description
  if (video_url !== undefined) insertRow.video_url = video_url

  const { data, error } = await verified.admin
    .from('onboarding_steps')
    .insert(insertRow)
    .select(
      'id, step_order, title, description, video_url, action_label, step_kind, created_at, updated_at',
    )
    .single()

  if (error) {
    console.error('admin onboarding-steps POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ step: data })
}

/** Update a step (admin). */
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
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof o.title === 'string') patch.title = o.title.trim()
  if (typeof o.description === 'string' || o.description === null) {
    patch.description = o.description === null ? null : String(o.description)
  }
  if (typeof o.video_url === 'string' || o.video_url === null) {
    patch.video_url =
      o.video_url === null ? null : String(o.video_url).trim() || null
  }
  if (typeof o.action_label === 'string') patch.action_label = o.action_label.trim()
  if (typeof o.step_order === 'number' && Number.isFinite(o.step_order)) {
    patch.step_order = Math.floor(o.step_order)
  }
  const k = parseKind(o.step_kind)
  if (k) patch.step_kind = k

  const { data, error } = await verified.admin
    .from('onboarding_steps')
    .update(patch)
    .eq('id', id)
    .select(
      'id, step_order, title, description, video_url, action_label, step_kind, created_at, updated_at',
    )
    .maybeSingle()

  if (error) {
    console.error('admin onboarding-steps PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ step: data })
}

/** Delete a step (admin). */
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
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await verified.admin.from('onboarding_steps').delete().eq('id', id).select('id').maybeSingle()

  if (error) {
    console.error('admin onboarding-steps DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

/** Reorder steps: body `{ "ordered_ids": ["uuid", ...] }` sets step_order 0..n-1 (admin). */
export async function PATCH(request: Request) {
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
  const ids = (body as { ordered_ids?: unknown }).ordered_ids
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) {
    return NextResponse.json({ error: 'ordered_ids must be an array of string ids' }, { status: 400 })
  }

  const ordered = ids as string[]
  const now = new Date().toISOString()

  for (let i = 0; i < ordered.length; i += 1) {
    const { error } = await verified.admin
      .from('onboarding_steps')
      .update({ step_order: i + 1000, updated_at: now })
      .eq('id', ordered[i])
    if (error) {
      console.error('admin onboarding-steps PATCH temp:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  for (let i = 0; i < ordered.length; i += 1) {
    const { error } = await verified.admin
      .from('onboarding_steps')
      .update({ step_order: i, updated_at: now })
      .eq('id', ordered[i])
    if (error) {
      console.error('admin onboarding-steps PATCH final:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
