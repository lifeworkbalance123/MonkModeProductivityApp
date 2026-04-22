import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Singleton row — must match `supabase/migrations/20260424204000_onboarding_settings.sql`. */
const SINGLETON_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

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

function isProgramKey(k: string): k is SelectedProgram {
  return k === 'sprint_standard' || k === 'sprint_monk' || k === 'transform'
}

async function upsertSettings(request: Request) {
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

  const program_selection_title =
    typeof o.program_selection_title === 'string' ? o.program_selection_title.trim() : ''
  const program_selection_subtitle =
    typeof o.program_selection_subtitle === 'string' ? o.program_selection_subtitle.trim() : ''

  let program_headers: Record<string, { title?: string | null; subtitle?: string | null }> = {}
  if (o.program_headers && typeof o.program_headers === 'object' && !Array.isArray(o.program_headers)) {
    const raw = o.program_headers as Record<string, unknown>
    for (const [k, v] of Object.entries(raw)) {
      if (!isProgramKey(k)) continue
      if (!v || typeof v !== 'object') continue
      const p = v as Record<string, unknown>
      program_headers[k] = {
        title: typeof p.title === 'string' ? p.title : p.title === null ? null : undefined,
        subtitle: typeof p.subtitle === 'string' ? p.subtitle : p.subtitle === null ? null : undefined,
      }
    }
  }

  if (!program_selection_title) {
    return NextResponse.json({ error: 'program_selection_title is required' }, { status: 400 })
  }
  if (!program_selection_subtitle) {
    return NextResponse.json({ error: 'program_selection_subtitle is required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { data, error } = await verified.admin
    .from('onboarding_settings')
    .upsert(
      {
        id: SINGLETON_ID,
        program_selection_title,
        program_selection_subtitle,
        program_headers,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    .select('id, program_selection_title, program_selection_subtitle, program_headers, updated_at')
    .single()

  if (error) {
    console.error('admin onboarding/settings upsert:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, settings: data })
}

/** Current onboarding_settings row (admin). */
export async function GET(request: Request) {
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

  const { data, error } = await verified.admin
    .from('onboarding_settings')
    .select('id, program_selection_title, program_selection_subtitle, program_headers, updated_at')
    .eq('id', SINGLETON_ID)
    .maybeSingle()

  if (error) {
    console.error('admin onboarding/settings GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}

/** Save title + subtitle (+ optional program_headers). Same body as PUT. */
export async function POST(request: Request) {
  return upsertSettings(request)
}

/** Alias for clients that prefer PUT. */
export async function PUT(request: Request) {
  return upsertSettings(request)
}
