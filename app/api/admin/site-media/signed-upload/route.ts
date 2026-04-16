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

async function ensureSiteMediaBucket(admin: ReturnType<typeof createServiceRoleClient>) {
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ],
    fileSizeLimit: 104_857_600,
  })
  if (error && !/already exists|duplicate/i.test(error.message)) {
    return error.message
  }
  return null
}

function safeExt(originalFileName: string): string {
  const raw = (originalFileName.split('.').pop() ?? 'mp4').toLowerCase()
  if (!/^[a-z0-9]+$/.test(raw)) return 'mp4'
  return raw
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
    console.error('site-media signed-upload:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: verified.status },
    )
  }

  const admin = verified.admin

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const prefix = b.prefix === 'rhythm' ? 'rhythm' : 'hero'
  const originalFileName = typeof b.originalFileName === 'string' ? b.originalFileName : ''
  const removePath = typeof b.removePath === 'string' && b.removePath.length > 0 ? b.removePath : null

  if (!originalFileName.trim()) {
    return NextResponse.json({ error: 'originalFileName is required' }, { status: 400 })
  }

  const bucketErr = await ensureSiteMediaBucket(admin)
  if (bucketErr) {
    return NextResponse.json({ error: `Storage bucket: ${bucketErr}` }, { status: 500 })
  }

  if (removePath) {
    await admin.storage.from(BUCKET).remove([removePath])
  }

  const ext = safeExt(originalFileName)
  const folder = prefix === 'rhythm' ? 'rhythm' : 'hero'
  const objectPath = `${folder}/${folder}-media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(objectPath, { upsert: true })
  if (error || !data) {
    console.error('createSignedUploadUrl:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to create upload URL' }, { status: 500 })
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
  })
}
