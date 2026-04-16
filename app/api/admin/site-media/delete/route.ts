import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

const BUCKET = 'site-media'

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

export async function POST(request: Request) {
  let verified
  try {
    verified = await verifyAdmin(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
    }
    console.error('site-media delete:', e)
    return NextResponse.json({ error: message }, { status: 500 })
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

  const paths = (body as { paths?: unknown }).paths
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === 'string' && p.length > 0)) {
    return NextResponse.json({ error: 'paths must be an array of non-empty strings' }, { status: 400 })
  }
  if (paths.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const admin = verified.admin
  const { error } = await admin.storage.from(BUCKET).remove(paths as string[])
  if (error) {
    console.error('storage remove:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
