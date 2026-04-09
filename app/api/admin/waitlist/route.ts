import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

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

export async function GET(request: Request) {
  let verified
  try {
    verified = await verifyAdmin(request)
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  if (!verified.ok) {
    return NextResponse.json({ error: verified.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: verified.status })
  }

  const admin = verified.admin
  const { data, error } = await admin
    .from('waitlist')
    .select('email, created_at, source, notified')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load waitlist' }, { status: 500 })
  }
  return NextResponse.json({ rows: data ?? [] })
}

