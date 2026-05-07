import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { DEEP_WORK_MP3_KEYS } from '@/lib/deep-work-site-settings'

export const dynamic = 'force-dynamic'

const BUCKET = 'lesson-media'

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let adminUser
  try {
    adminUser = await getAdminUser(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return json({ error: 'Server misconfigured' }, 503)
    }
    console.error('deep-work clear-audio:', e)
    return json({ error: message }, 500)
  }
  if (adminUser.error || !adminUser.user) {
    return json({ error: adminUser.error ?? 'Unauthorized' }, adminUser.status)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const slot = Number((body as { slot?: unknown }).slot)
  if (!Number.isInteger(slot) || slot < 0 || slot >= DEEP_WORK_MP3_KEYS.length) {
    return json({ error: `Invalid slot (use 0–${DEEP_WORK_MP3_KEYS.length - 1})` }, 400)
  }

  const key = DEEP_WORK_MP3_KEYS[slot]
  const admin = createServiceRoleClient()

  const { data: existing } = await admin
    .from('site_settings')
    .select('value, media_storage_path, is_active')
    .eq('key', key)
    .maybeSingle()

  const prevPath = (existing as { media_storage_path?: string | null } | null)?.media_storage_path
  if (prevPath) {
    await admin.storage.from(BUCKET).remove([prevPath])
  }

  const label =
    ((existing as { value?: string | null } | null)?.value ?? '').trim() || `Track ${slot + 1}`

  const isActive = (existing as { is_active?: boolean | null } | null)?.is_active !== false

  const { error } = await admin.from('site_settings').upsert(
    {
      key,
      value: label,
      media_type: null,
      media_url: null,
      media_storage_path: null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )
  if (error) {
    console.error('deep-work clear site_settings:', error)
    return json({ error: error.message ?? 'Failed to update settings' }, 500)
  }

  return json({ ok: true as const, key }, 200)
}
