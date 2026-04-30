import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { DEEP_WORK_MP3_KEYS } from '@/lib/deep-work-site-settings'
import { getAdminUser } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'lesson-media'

function safeExt(originalFileName: string): string {
  const raw = (originalFileName.split('.').pop() ?? 'mp3').toLowerCase()
  if (!/^[a-z0-9]+$/.test(raw)) return 'mp3'
  return raw
}

export async function POST(request: Request) {
  let adminUser
  try {
    adminUser = await getAdminUser(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
    }
    console.error('deep-work signed-upload:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
  if (adminUser.error || !adminUser.user) {
    return NextResponse.json(
      { error: adminUser.error ?? 'Unauthorized' },
      { status: adminUser.status },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const slot = typeof b.slot === 'number' ? b.slot : Number.parseInt(String(b.slot), 10)
  const originalFileName = typeof b.originalFileName === 'string' ? b.originalFileName : ''
  const removePath = typeof b.removePath === 'string' && b.removePath.length > 0 ? b.removePath : null
  const preferResumable = b.preferResumable === true

  if (!Number.isInteger(slot) || slot < 0 || slot >= DEEP_WORK_MP3_KEYS.length) {
    return NextResponse.json(
      { error: `Invalid slot (use 0–${DEEP_WORK_MP3_KEYS.length - 1})` },
      { status: 400 },
    )
  }

  if (!originalFileName.trim()) {
    return NextResponse.json({ error: 'originalFileName is required' }, { status: 400 })
  }

  const admin = createServiceRoleClient()

  if (removePath) {
    await admin.storage.from(BUCKET).remove([removePath])
  }

  const ext = safeExt(originalFileName)
  const key = DEEP_WORK_MP3_KEYS[slot]
  const objectPath = `deep-work/${key}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  if (preferResumable) {
    return NextResponse.json({
      path: objectPath,
      resumable: true as const,
    })
  }

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(objectPath, {
    upsert: true,
  })
  if (error || !data) {
    console.error('deep-work createSignedUploadUrl:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create upload URL' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
  })
}

