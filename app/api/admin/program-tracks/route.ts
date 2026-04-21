import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isSelectedProgram, type ProgramTrackConfig } from '@/lib/onboardingProgramFlow'

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

function validateTrack(raw: Record<string, unknown>): ProgramTrackConfig | null {
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!isSelectedProgram(id)) return null

  const label = typeof raw.label === 'string' ? raw.label.trim() : ''
  const duration = typeof raw.duration === 'string' ? raw.duration.trim() : ''
  const benefit = typeof raw.benefit === 'string' ? raw.benefit.trim() : ''
  const intensity = typeof raw.intensity === 'string' ? raw.intensity.trim() : ''
  const price_cents = typeof raw.price_cents === 'number' ? Math.floor(raw.price_cents) : NaN
  const currency = typeof raw.currency === 'string' ? raw.currency.trim().toUpperCase() : ''
  const checkout_plan = typeof raw.checkout_plan === 'string' ? raw.checkout_plan.trim() : ''
  const sort_order = typeof raw.sort_order === 'number' ? Math.floor(raw.sort_order) : NaN
  const is_active = raw.is_active === true

  const checkoutOk = checkout_plan === 'sprint' || checkout_plan === 'monk_mode' || checkout_plan === 'transform'
  if (!label || !duration || !benefit || !intensity || !Number.isFinite(price_cents) || price_cents < 0) return null
  if (!currency || !checkoutOk || !Number.isFinite(sort_order)) return null

  return {
    id,
    label,
    duration,
    benefit,
    intensity,
    price_cents,
    currency,
    checkout_plan: checkout_plan as ProgramTrackConfig['checkout_plan'],
    sort_order,
    is_active,
  }
}

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
    .from('program_tracks')
    .select('id, label, duration, benefit, intensity, price_cents, currency, checkout_plan, sort_order, is_active')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tracks: data ?? [] })
}

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

  const rawTracks = (body as { tracks?: unknown })?.tracks
  if (!Array.isArray(rawTracks) || rawTracks.length !== 3) {
    return NextResponse.json({ error: 'tracks must contain all 3 program rows' }, { status: 400 })
  }

  const parsed: ProgramTrackConfig[] = []
  for (const raw of rawTracks) {
    if (!raw || typeof raw !== 'object') return NextResponse.json({ error: 'Invalid track row' }, { status: 400 })
    const t = validateTrack(raw as Record<string, unknown>)
    if (!t) return NextResponse.json({ error: 'Invalid track fields' }, { status: 400 })
    parsed.push(t)
  }

  const ids = new Set(parsed.map((t) => t.id))
  if (ids.size !== 3) return NextResponse.json({ error: 'Duplicate track ids' }, { status: 400 })

  const { error } = await verified.admin.from('program_tracks').upsert(parsed, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
