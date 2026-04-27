import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { DEEP_WORK_MP3_KEYS } from '@/lib/deep-work-site-settings'

export const dynamic = 'force-dynamic'

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status })
}

/**
 * After a successful **client-side** storage upload, persist `site_settings` with the
 * service role so INSERT/upsert for new slot keys cannot fail due to RLS quirks.
 */
export async function POST(request: Request) {
  let adminUser
  try {
    adminUser = await getAdminUser(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return json({ error: 'Server misconfigured' }, 503)
    }
    console.error('deep-work commit-track:', e)
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

  const b = body as {
    slot?: unknown
    label?: unknown
    publicUrl?: unknown
    storagePath?: unknown
    isActive?: unknown
  }

  const slot = typeof b.slot === 'number' ? b.slot : Number.parseInt(String(b.slot), 10)
  if (!Number.isInteger(slot) || slot < 0 || slot >= DEEP_WORK_MP3_KEYS.length) {
    return json({ error: `Invalid slot (use 0–${DEEP_WORK_MP3_KEYS.length - 1})` }, 400)
  }

  const publicUrl = typeof b.publicUrl === 'string' ? b.publicUrl.trim() : ''
  const storagePath = typeof b.storagePath === 'string' ? b.storagePath.trim() : ''
  if (!publicUrl || !storagePath) {
    return json({ error: 'publicUrl and storagePath are required' }, 400)
  }

  const labelRaw = typeof b.label === 'string' ? b.label.trim() : ''
  const label = labelRaw.length > 0 ? labelRaw : `Track ${slot + 1}`

  const isActive = b.isActive !== false

  const key = DEEP_WORK_MP3_KEYS[slot]
  const admin = createServiceRoleClient()

  const { error: dbErr } = await admin.from('site_settings').upsert(
    {
      key,
      value: label,
      media_type: 'audio',
      media_url: publicUrl,
      media_storage_path: storagePath,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (dbErr) {
    console.error('deep-work commit-track upsert:', dbErr)
    return json({ error: dbErr.message ?? 'Failed to save settings' }, 500)
  }

  return json({ ok: true as const, key }, 200)
}
