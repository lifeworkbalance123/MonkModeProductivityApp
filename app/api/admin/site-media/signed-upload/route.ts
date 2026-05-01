import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import {
  ensureSiteMediaBucket,
  looksLikeStorageSizePolicyError,
  SITE_MEDIA_BUCKET_ID,
} from '@/lib/site-media-storage'

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
  /** Client uses TUS resumable upload (recommended by Supabase for files over ~6 MB). */
  const preferResumable = b.preferResumable === true

  if (!originalFileName.trim()) {
    return NextResponse.json({ error: 'originalFileName is required' }, { status: 400 })
  }

  const bucketErr = await ensureSiteMediaBucket(admin)
  if (bucketErr) {
    const hint = looksLikeStorageSizePolicyError(bucketErr)
      ? ' In Supabase: Project Settings → Storage → raise “Global file size limit” above your file size. You can also lower SITE_MEDIA_MAX_UPLOAD_BYTES to match your project cap.'
      : ''
    return NextResponse.json({ error: `Storage bucket: ${bucketErr}${hint}` }, { status: 500 })
  }

  if (removePath) {
    await admin.storage.from(SITE_MEDIA_BUCKET_ID).remove([removePath])
  }

  const ext = safeExt(originalFileName)
  const folder = prefix === 'rhythm' ? 'rhythm' : 'hero'
  const objectPath = `${folder}/${folder}-media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const { data, error } = await admin.storage.from(SITE_MEDIA_BUCKET_ID).createSignedUploadUrl(objectPath, {
    upsert: true,
  })
  if (error || !data) {
    console.error('createSignedUploadUrl:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to create upload URL' }, { status: 500 })
  }

  /** Resumable TUS uses `/upload/resumable/sign` + `x-signature` so storage never parses the browser session JWT (avoids Invalid Compact JWS on some projects). */
  if (preferResumable) {
    return NextResponse.json({
      path: data.path,
      token: data.token,
      resumable: true as const,
    })
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
  })
}
