import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()
  const {
    data: { user },
  } = await admin.auth.getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { enabled?: boolean }
  try {
    body = (await request.json()) as { enabled?: boolean }
  } catch {
    body = {}
  }

  const enabled = Boolean(body.enabled)

  const { data, error } = await admin
    .from('user_programs')
    .update({ witness_enabled: enabled })
    .eq('user_id', user.id)
    .eq('status', 'active')
    .select('witness_enabled')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  return NextResponse.json({ ok: true as const, enabled: Boolean((data as any).witness_enabled) })
}

