import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isOnboardingStepKind, type OnboardingStepKind } from '@/lib/onboardingSteps'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isProgramType(v: unknown): v is SelectedProgram {
  return v === 'sprint_standard' || v === 'sprint_monk' || v === 'transform'
}

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

const SELECT_FIELDS =
  'id, program_type, step_order, title, content, video_url, image_url, button_label, step_kind, created_at, updated_at'

function mapRow(data: Record<string, unknown>) {
  return {
    id: data.id,
    program_type: data.program_type,
    step_order: data.step_order,
    title: data.title,
    description: data.content ?? null,
    video_url: data.video_url ?? null,
    image_url: data.image_url ?? null,
    action_label: data.button_label ?? 'Continue',
    step_kind: data.step_kind,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/** Create a template step for a program (admin). */
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

  const program_type = o.program_type
  if (!isProgramType(program_type)) {
    return NextResponse.json({ error: 'program_type is required' }, { status: 400 })
  }

  const title = typeof o.title === 'string' ? o.title.trim() : ''
  const button_label =
    typeof o.button_label === 'string' && o.button_label.trim()
      ? o.button_label.trim()
      : typeof o.action_label === 'string' && o.action_label.trim()
        ? String(o.action_label).trim()
        : 'Continue'
  const content =
    typeof o.description === 'string'
      ? o.description
      : typeof o.content === 'string'
        ? o.content
        : o.description === null || o.content === null
          ? null
          : undefined
  const video_url =
    typeof o.video_url === 'string'
      ? o.video_url.trim() || null
      : o.video_url === null
        ? null
        : undefined
  const image_url =
    typeof o.image_url === 'string'
      ? o.image_url.trim() || null
      : o.image_url === null
        ? null
        : undefined

  const step_kind = parseKind(o.step_kind) ?? 'content'
  let step_order =
    typeof o.step_order === 'number' && Number.isFinite(o.step_order)
      ? Math.floor(o.step_order)
      : NaN

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  if (!Number.isFinite(step_order)) {
    const { data: maxRow } = await verified.admin
      .from('onboarding_step_templates')
      .select('step_order')
      .eq('program_type', program_type)
      .order('step_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    step_order = ((maxRow as { step_order?: number } | null)?.step_order ?? -1) + 1
  }

  const now = new Date().toISOString()
  const insertRow: Record<string, unknown> = {
    program_type,
    step_order,
    title,
    button_label: button_label || 'Continue',
    step_kind,
    created_at: now,
    updated_at: now,
  }
  if (content !== undefined) insertRow.content = content
  if (video_url !== undefined) insertRow.video_url = video_url
  if (image_url !== undefined) insertRow.image_url = image_url

  const { data, error } = await verified.admin
    .from('onboarding_step_templates')
    .insert(insertRow)
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    console.error('admin onboarding-steps POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ step: mapRow(data as Record<string, unknown>) })
}

/** Update a template step (admin). */
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
  if ('content' in o && (typeof o.content === 'string' || o.content === null)) {
    patch.content = o.content === null ? null : String(o.content)
  } else if ('description' in o && (typeof o.description === 'string' || o.description === null)) {
    patch.content = o.description === null ? null : String(o.description)
  }
  if (typeof o.video_url === 'string' || o.video_url === null) {
    patch.video_url =
      o.video_url === null ? null : String(o.video_url).trim() || null
  }
  if (typeof o.image_url === 'string' || o.image_url === null) {
    patch.image_url =
      o.image_url === null ? null : String(o.image_url).trim() || null
  }
  const btn =
    typeof o.button_label === 'string'
      ? o.button_label.trim()
      : typeof o.action_label === 'string'
        ? o.action_label.trim()
        : ''
  if (btn) patch.button_label = btn
  if (typeof o.step_order === 'number' && Number.isFinite(o.step_order)) {
    patch.step_order = Math.floor(o.step_order)
  }
  const k = parseKind(o.step_kind)
  if (k) patch.step_kind = k

  const { data, error } = await verified.admin
    .from('onboarding_step_templates')
    .update(patch)
    .eq('id', id)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('admin onboarding-steps PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ step: mapRow(data as Record<string, unknown>) })
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

  const { data, error } = await verified.admin
    .from('onboarding_step_templates')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('admin onboarding-steps DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

/** Reorder steps for one program: `{ program_type, ordered_ids: [...] }` sets step_order 0..n-1 (admin). */
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
  const program_type = (body as { program_type?: unknown }).program_type
  if (!isProgramType(program_type)) {
    return NextResponse.json({ error: 'program_type is required' }, { status: 400 })
  }

  const ids = (body as { ordered_ids?: unknown }).ordered_ids
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) {
    return NextResponse.json({ error: 'ordered_ids must be an array of string ids' }, { status: 400 })
  }

  const ordered = ids as string[]
  const now = new Date().toISOString()

  for (let i = 0; i < ordered.length; i += 1) {
    const { error } = await verified.admin
      .from('onboarding_step_templates')
      .update({ step_order: i + 1000, updated_at: now })
      .eq('id', ordered[i])
      .eq('program_type', program_type)
    if (error) {
      console.error('admin onboarding-steps PATCH temp:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  for (let i = 0; i < ordered.length; i += 1) {
    const { error } = await verified.admin
      .from('onboarding_step_templates')
      .update({ step_order: i, updated_at: now })
      .eq('id', ordered[i])
      .eq('program_type', program_type)
    if (error) {
      console.error('admin onboarding-steps PATCH final:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
